<script>
  import { onMount } from "svelte";
  import { createRecogniser } from "./services/SpeechRecogniser.js";

  const tmpRecordDuration = 10000;

  let audioElement;
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
  let isReceivingSpeech = false;
  let phrases = [];

  createRecogniser({
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

  async function shareFile() {
    try {
      const timeString = new Date()
        .toISOString()
        .substr(0, 19)
        .replace(/:/g, "-");

      var txtBlob = new Blob(
        // ["Welcome to Websparrow.org."],
        [phrases.map(p => `[${p.timeString}] ${p.transcript}`).join(" ")],
        {
          // type: "text/plain;charset=utf-8"
          type: "text/plain"
        }
      );
      console.debug("timeString", timeString);
      const txtFile = new File([txtBlob], `Transcript-${timeString}.txt`, {
        type: txtBlob.type
      });

      const oggFile = new File([lastAudioBlob], `Voicenote-${timeString}.ogg`, {
        type: lastAudioBlob.type
      });
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

  onMount(async () => {
    let options = { audio: true, video: false };
    const stream = await navigator.mediaDevices.getUserMedia(options);

    let AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioContext = new AudioContext();
    let source = audioContext.createMediaStreamSource(stream);
    let recorder = new WebAudioRecorder(source, {
      workerDir: "lib-minified/", // must end with slash
      encoding: "ogg",
      options: {
        encodeAfterRecord: true,
        ogg: { bitRate: "320" }
      }
    });

    recorder.onEncoderLoading = function(recorder, encoding) {
      console.debug("onEncoderLoading", recorder, encoding);
    };
    recorder.onEncoderLoaded = function(recorder, encoding) {
      console.debug("onEncoderLoaded", recorder, encoding);
    };
    recorder.onTimeout = function(recorder) {
      console.debug("onTimeout", recorder);
    };
    recorder.onEncodingProgress = function(recorder, progress) {
      console.debug("onEncodingProgress", recorder, progress);
    };
    recorder.onEncodingCanceled = function(recorder) {
      console.debug("onEncodingCanceled", recorder);
    };
    recorder.onComplete = async function(recorder, blob) {
      console.debug("onComplete", recorder, blob);
      let audioElementSource = window.URL.createObjectURL(blob);
      audioElement.src = audioElementSource;
      audioElement.controls = true;

      console.debug("audioElementSource", audioElementSource);
      console.debug("blob", blob);
      lastAudioBlob = blob;
    };
    recorder.onError = function(recorder, message) {
      console.debug("onError", recorder, message);
    };

    recorder.startRecording();

    setTimeout(() => {
      recorder.finishRecording();
    }, tmpRecordDuration);
  });
</script>

<style>
  .time {
    color: #aaa;
    font-size: 10px;
  }
</style>

<audio bind:this={audioElement} />

{#if lastAudioBlob}
  <div>
    <button on:click={shareFile}>Share file</button>
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
  <li>
    {#if isReceivingSpeech}Receiving speech...{:else}Waiting for speech...{/if}
  </li>

  {#each phrases as phrase}
    <li>
      <span class="time">[{phrase.timeString}]</span>
      {phrase.transcript}
    </li>
  {/each}
</ol>
