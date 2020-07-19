<script>
  import { createEventDispatcher } from "svelte";
  import { createRecogniser } from "../services/SpeechRecogniser2.js";

  const dispatch = createEventDispatcher();

  export let value = "";

  let recogniser;

  function transcribeAudioPhrase() {
    if (recogniser) {
      console.error("recogniser is already set");
      return;
    }

    dispatch("start-listening");

    recogniser = createRecogniser({
      onSetVoiceRecognitionActive: val => {
        console.debug("onSetVoiceRecognitionActive", val);
        if (!val) {
          recogniser = undefined;
        }
      },
      onTranscriptReceived: transcript => {
        console.debug("onTranscriptReceived", transcript);
        value = transcript;
      },
      onSpeechRecognitionError: error => {
        console.debug("onSpeechRecognitionError", error);
        recogniser = undefined;
      }
    });
  }
</script>

<input bind:value placeholder="Name this bookmark..." />

{#if !recogniser}
  <button on:click={transcribeAudioPhrase}>
    <i class="fa fa-microphone" />
  </button>
{:else}
  <i class="fa fa-spinner fa-spin" />
{/if}
