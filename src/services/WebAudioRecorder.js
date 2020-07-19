export async function createRecorder({ onComplete }) {
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

    recorder.onEncoderLoading = function (recorder, encoding) {
        console.debug("onEncoderLoading", recorder, encoding);
    };
    recorder.onEncoderLoaded = function (recorder, encoding) {
        console.debug("onEncoderLoaded", recorder, encoding);
    };
    recorder.onTimeout = function (recorder) {
        console.debug("onTimeout", recorder);
    };
    recorder.onEncodingProgress = function (recorder, progress) {
        console.debug("onEncodingProgress", recorder, progress);
    };
    recorder.onEncodingCanceled = function (recorder) {
        console.debug("onEncodingCanceled", recorder);
    };
    recorder.onComplete = async function (recorder, blob) {
        console.debug("onComplete", recorder, blob);
        onComplete({ blob: blob })
    };
    recorder.onError = function (recorder, message) {
        console.error("Recorder onError", recorder, message);
    };

    return recorder
}