<script>
  // import { createRecogniser } from "../services/SpeechRecogniser2.js";
  import { createRecorder } from "../services/WebAudioRecorder2.js";
  import VoiceRecognitionInput from "./VoiceRecognitionInput.svelte";

  let audioElement;
  let audioElementCurrentTime;

  let recorder;

  let bookmarks = [];
  let lastAudioBlob;
  let currentBookmark;

  function getFilenameSafeTimeString() {
    return new Date()
      .toISOString()
      .substr(0, 19)
      .replace(/:/g, "-");
  }

  // createRecogniser({})
  async function startRecording() {
    if (recorder) {
      alert("Recorder already created");
      return;
    }

    audioElement.src = "";
    bookmarks = [];
    lastAudioBlob = undefined;

    recorder = await createRecorder({
      onComplete: ({ blob }) => {
        let audioElementSource = window.URL.createObjectURL(blob);
        audioElement.src = audioElementSource;

        console.debug("audioElementSource", audioElementSource);
        console.debug("blob", blob);
        lastAudioBlob = blob;
      }
    });

    recorder.startRecording();

    addEmptyBookmark(); // starting time
  }

  function finishRecording() {
    recorder.finishRecording();
    recorder = undefined;
  }

  function insertBookmark(bookmark) {
    const newOrderedBookmarks = [...bookmarks, bookmark];
    newOrderedBookmarks.sort(function(a, b) {
      return a.time - b.time;
    });
    bookmarks = newOrderedBookmarks;
  }

  function addEmptyBookmark() {
    if (recorder && recorder.isRecording()) {
      const bookmarkTime = recorder.recordingTime();
      insertBookmark({
        time: bookmarkTime,
        transcript: ""
      });
    } else if (lastAudioBlob && audioElement.currentTime > 0) {
      const bookmarkTime = audioElement.currentTime;
      insertBookmark({
        time: bookmarkTime,
        transcript: ""
      });
    } else {
      alert("Unable to add bookmark, recording or player must be busy");
      return;
    }
  }

  function deleteBookmark(bookmark) {
    bookmarks = bookmarks.filter(b => b !== bookmark);
  }

  function jumpToAudioLocation(bookmark) {
    audioElement.currentTime = bookmark.time;
    audioElement.play();
  }

  function stopAudioPlaying() {
    audioElement.pause();
  }

  function onAudioTimeUpdate($event) {
    let tmpBookmark;
    for (let i = 0; i < bookmarks.length; i++) {
      const bookmark = bookmarks[i];
      if (
        !tmpBookmark ||
        (bookmark.time <= audioElement.currentTime &&
          bookmark.time > tmpBookmark.time)
      ) {
        tmpBookmark = bookmark;
      }
    }
    currentBookmark = tmpBookmark;

    audioElementCurrentTime = audioElement.currentTime;
    // console.debug("audioElement.currentTime", audioElement.currentTime, $event);
  }

  function combineBookmarksAsText() {
    return bookmarks
      .map(b => `[${b.time.toFixed(2)}s] ${b.transcript}`)
      .join("\n");
  }

  function createTextFile(filenameSafeTimeString) {
    const txtBlob = new Blob([combineBookmarksAsText()], {
      // type: "text/plain;charset=utf-8"
      type: "text/plain"
    });
    return new File([txtBlob], `Transcript-${filenameSafeTimeString}.txt`, {
      type: txtBlob.type
    });
  }

  function createOggFile(filenameSafeTimeString) {
    const oggFile = new File(
      [lastAudioBlob],
      `Voicenote-${filenameSafeTimeString}.ogg`,
      {
        type: lastAudioBlob.type
      }
    );
    console.debug("oggFile", oggFile);
    return oggFile;
  }

  async function shareFiles() {
    try {
      const filenameSafeTimeString = getFilenameSafeTimeString();
      console.debug("filenameSafeTimeString", filenameSafeTimeString);

      const txtFile = createTextFile(filenameSafeTimeString);
      console.debug("txtFile", txtFile);
      const oggFile = createOggFile(filenameSafeTimeString);
      console.debug("oggFile", oggFile);

      //   alert("NOTE: " + combineBookmarksAsText());

      await navigator.share({
        title: `Voice note ${filenameSafeTimeString}`,
        text: combineBookmarksAsText(),
        files: [oggFile, txtFile]
        // files: [txtFile],
        // files: [oggFile],
      });
    } catch (err) {
      const errStr = String(err);
      if (!errStr.toLowerCase().includes("canceled")) {
        alert(`Error sharing: ${String(errStr)}`);
      }
    }
  }

  async function shareAudioFile() {
    try {
      const filenameSafeTimeString = getFilenameSafeTimeString();
      console.debug("filenameSafeTimeString", filenameSafeTimeString);

      const oggFile = createOggFile(filenameSafeTimeString);
      console.debug("oggFile", oggFile);

      await navigator.share({
        title: `Voice note ${filenameSafeTimeString}`,
        files: [oggFile]
      });
    } catch (err) {
      const errStr = String(err);
      if (!errStr.toLowerCase().includes("canceled")) {
        alert(`Error sharing: ${String(errStr)}`);
      }
    }
  }

  async function shareBookmarksOnly() {
    try {
      const filenameSafeTimeString = getFilenameSafeTimeString();
      console.debug("filenameSafeTimeString", filenameSafeTimeString);

      await navigator.share({
        title: `Voice note ${filenameSafeTimeString}`,
        text: combineBookmarksAsText()
      });
    } catch (err) {
      const errStr = String(err);
      if (!errStr.toLowerCase().includes("canceled")) {
        alert(`Error sharing: ${String(errStr)}`);
      }
    }
  }

  $: allBookmarksHasTranscript = !bookmarks.find(b => !b.transcript);
</script>

<style>
  table.bordered-table {
    border-collapse: collapse;
  }
  table.bordered-table,
  table.bordered-table th,
  table.bordered-table td {
    border: 1px solid #e0e0e0;
    padding: 10px;
  }
  .bookmark.has-transcript {
    color: green;
  }
  .bookmark.no-transcript {
    color: red;
  }
  .spacer-20 {
    margin-top: 20px;
  }
</style>

{#if !recorder}
  <button on:click={startRecording}>Start recording</button>
{:else}
  <div>
    <button on:click={finishRecording}>Finish recording</button>
  </div>
{/if}

<div>
  <audio bind:this={audioElement} on:timeupdate={onAudioTimeUpdate} controls />
</div>

{#if !recorder && bookmarks.length > 0}
  <table class="bordered-table">
    <thead>
      <tr>
        <th colspan="20">Bookmarks</th>
      </tr>
      <tr>
        <th>Time</th>
        <th>Title</th>
        <th>Current</th>
        <th>Actions</th>
      </tr>
    </thead>

    <tbody>
      {#each bookmarks as bookmark}
        <tr>
          <td on:click={() => jumpToAudioLocation(bookmark)}>
            <span
              class="clickable {bookmark.transcript ? 'bookmark has-transcript' : 'bookmark no-transcript'}">
              [{bookmark.time.toFixed(2)}s]
            </span>
          </td>
          <td>
            <VoiceRecognitionInput
              bind:value={bookmark.transcript}
              on:start-listening={stopAudioPlaying} />
          </td>
          <td class="text-center">
            {#if currentBookmark === bookmark}
              <i class="fa fa-check" />
            {/if}
          </td>
          <td class="text-center">
            <button on:click={() => deleteBookmark(bookmark)}>
              <i class="fa fa-trash-o" />
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
{#if recorder && bookmarks.length > 0}
  <div>Bookmarks:</div>
  <ol>
    {#each bookmarks as bookmark}
      <li>[{bookmark.time.toFixed(2)}s]</li>
    {/each}
  </ol>
{/if}

<div class="spacer-20" />

{#if recorder || lastAudioBlob}
  <div>
    <button on:click={addEmptyBookmark}>
      Add bookmark
      {#if audioElementCurrentTime}({audioElementCurrentTime.toFixed(2)}s){/if}
    </button>
  </div>
{/if}

<div class="spacer-20" />

{#if lastAudioBlob && allBookmarksHasTranscript}
  <!-- <h1 style="color:green">Well done, you filled all bookmarks</h1> -->
  <button on:click={shareAudioFile}>Share audio only</button>
  &nbsp;&nbsp;
  <button on:click={shareBookmarksOnly}>Share bookmarks only</button>
  &nbsp;&nbsp;
  <button on:click={shareFiles}>Share both</button>
{/if}
