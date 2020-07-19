<script>
  import builtTime from "./builtTime.js";
  import RecordAndRecognise from "./components/RecordAndRecognise.svelte";
  import BookmarkWhileRecording from "./components/BookmarkWhileRecording.svelte";
</script>

<style>
  .built-time {
    font-size: 10px;
    color: #aaa;
    margin-bottom: 10px;
    text-align: center;
  }
</style>

<div class="built-time">Built on {builtTime}</div>
<!-- <RecordAndRecognise /> -->

<BookmarkWhileRecording />
