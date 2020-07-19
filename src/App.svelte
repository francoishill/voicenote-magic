<script>
  import { onMount } from "svelte";
  import { createRecogniser } from "./services/SpeechRecogniser.js";
  import { createRecorder } from "./services/WebAudioRecorder.js";
  import { saveFile } from "./services/FileIO.js";

  let domIsReady = false;

  const tmpRecordDuration = 5000;

  let audioElement;
  let recorder;
  let recognition;
  let stopRecognisingFunc;
  let errors = [];
  let lastAudioBlob;

  function addError(err) {
    errors = [...errors, err];
  }

  let tmpText = "";
  for (let i = 0; i < 1000; i++) {
    tmpText += "Voice note\n";
  }

  let speechRecognitionError;
  let isRecordingBusy = false;
  let isReceivingSpeech = false;
  let phrases = [];

  function getFilenameSafeTimeString() {
    return new Date()
      .toISOString()
      .substr(0, 19)
      .replace(/:/g, "-");
  }

  function createTextBlobFromPhrases() {
    return new Blob(
      // ["Welcome to Websparrow.org."],
      [phrases.map(p => `[${p.timeString}] ${p.transcript}`).join("\n")],
      {
        // type: "text/plain;charset=utf-8"
        type: "text/plain"
      }
    );
  }

  async function shareFiles() {
    try {
      const filenameSafeTimeString = getFilenameSafeTimeString();

      const txtBlob = createTextBlobFromPhrases();
      console.debug("filenameSafeTimeString", filenameSafeTimeString);
      const txtFile = new File(
        [txtBlob],
        `Transcript-${filenameSafeTimeString}.txt`,
        {
          type: txtBlob.type
        }
      );

      const oggFile = new File(
        [lastAudioBlob],
        `Voicenote-${filenameSafeTimeString}.ogg`,
        {
          type: lastAudioBlob.type
        }
      );
      console.debug("oggFile", oggFile);

      await navigator.share({
        //   files: [blob],
        //   files: [audioElementSource],
        // files: [file],
        // files: [oggFile, oggFile],
        files: [oggFile, txtFile],
        // files: [oggFile],
        // files: [txtFile],
        title: "Voice note"
        // text: "Voice note"
        // text: tmpText
      });
    } catch (err) {
      addError("Error sharing: " + String(err));
    }
  }

  async function saveFiles() {
    const txtBlob = createTextBlobFromPhrases();

    const filenameSafeTimeString = getFilenameSafeTimeString();
    saveFile({
      blob: txtBlob,
      fileName: `Transcript-${filenameSafeTimeString}.txt`
    });

    saveFile({
      blob: lastAudioBlob,
      fileName: `Voicenote-${filenameSafeTimeString}.ogg`
    });
  }

  async function startRecordingAndRecognition() {
    recorder = await createRecorder({
      onComplete: ({ blob }) => {
        let audioElementSource = window.URL.createObjectURL(blob);
        audioElement.src = audioElementSource;
        audioElement.controls = true;

        console.debug("audioElementSource", audioElementSource);
        console.debug("blob", blob);
        lastAudioBlob = blob;
      }
    });

    const recogniserResult = createRecogniser({
      onTranscriptReceived: transcript => {
        phrases = [
          {
            timeString: new Date().toISOString().substr(0, 19),
            transcript
          },
          ...phrases
        ];
      },
      onSpeechStart: () => {
        isReceivingSpeech = true;
      },
      onSpeechEnd: () => {
        isReceivingSpeech = false;
      },
      onSpeechRecognitionError: error => {
        speechRecognitionError = error;
      }
    });
    recognition = recogniserResult.recognition;
    stopRecognisingFunc = recogniserResult.stopRecognising;

    recorder.startRecording();
    isRecordingBusy = true;
  }

  function finishRecordingAndRecognition() {
    recorder.finishRecording();
    stopRecognisingFunc();

    isRecordingBusy = true;
  }

  onMount(async () => {
    domIsReady = true;
  });
</script>

<style>
  .time {
    color: #aaa;
    font-size: 10px;
  }
</style>

{#if domIsReady}
  {#if isRecordingBusy}
    <div>
      <button on:click={finishRecordingAndRecognition}>Finish recording</button>
    </div>
  {:else}
    <div>
      <button on:click={startRecordingAndRecognition}>
        Test recording and recognition
      </button>
    </div>
  {/if}

  <audio bind:this={audioElement} />

  {#if lastAudioBlob}
    <div>
      <button on:click={shareFiles}>Share files</button>
    </div>
    <div>
      <button on:click={saveFiles}>Save files</button>
    </div>
  {/if}

  {#if errors.length > 0}
    <div>
      Errors:
      <ul>
        {#each errors as err}
          <li>{err}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <ol>
    {#if speechRecognitionError}
      <li>ERROR: {speechRecognitionError}</li>
    {/if}

    {#if isRecordingBusy}
      {#if isReceivingSpeech}
        <li>Receiving speech...</li>
      {:else}
        <li>No speech detected...</li>
      {/if}
    {/if}

    {#each phrases as phrase}
      <li>
        <span class="time">[{phrase.timeString}]</span>
        {phrase.transcript}
      </li>
    {/each}
  </ol>
{:else}
  <div>Loading...</div>
{/if}
