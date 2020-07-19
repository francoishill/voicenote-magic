export function createRecogniser({ onTranscriptReceived, onSpeechStart, onSpeechEnd, onSpeechRecognitionError }) {
    let speechRecognitionError;
    let voiceRecognitionActive = false;
    let keepListening = true;

    var speech = window["SpeechRecognition"] || window["webkitSpeechRecognition"];

    if (speech) {
        // new speech recognition object
        var recognition = new speech();

        recognition.maxAlternatives = 2;
        // recognition.continuous = true;
        recognition.lang = "af-ZA"; // Afrikaans only supported in Chrome
        // recognition.lang = 'en-US';

        // This will run when the speech recognition service returns a result
        recognition.onstart = function () {
            voiceRecognitionActive = true;
            console.log(
                "Voice recognition started. Try speaking into the microphone."
            );
        };
        recognition.onend = function () {
            voiceRecognitionActive = false;
            // console.log("Speech recognition service disconnected");
            if (!speechRecognitionError && keepListening) {
                recognition.start();
            }
        };

        recognition.onresult = function (event) {
            var transcript = event.results[event.results.length - 1][0].transcript;
            console.log('transcript', transcript);
            if (onTranscriptReceived) {
                onTranscriptReceived(transcript)
            }
        };

        recognition.onnomatch = function () {
            console.log("Speech not recognised");
        };
        recognition.onerror = function (event) {
            console.error("Speech recognition error detected: " + event.error);
            // if (event.error == 'no-speech') {
            //     if (!speechRecognitionError) {
            //         recognition.start();
            //     }
            // } else {
            //     speechRecognitionError = event.error;
            //     onSpeechRecognitionError(event.error)
            // }

            speechRecognitionError = event.error;
            onSpeechRecognitionError(event.error)
            if (event.error == 'no-speech') {
                console.error('See commented code above, should call start() again if no-speech error occurred')
                // alert('See commented code above, should call start() again if no-speech error occurred')
            }
        };

        recognition.onaudiostart = function () {
            console.log("Audio capturing started");
        };
        recognition.onaudioend = function () {
            console.log("Audio capturing ended");
        };

        recognition.onsoundstart = function () {
            console.log("Some sound is being received");
        };
        recognition.onsoundend = function () {
            console.log("Sound has stopped being received");
        };

        recognition.onspeechstart = function () {
            console.log("Speech has been detected");
            if (onSpeechStart) { onSpeechStart(); }
        };
        recognition.onspeechend = function () {
            console.log("Speech has stopped being detected");
            if (onSpeechEnd) { onSpeechEnd(); }
        };

        // start recognition
        recognition.start();

        function stopRecognising() {
            keepListening = false
            recognition.stop()
        }

        return { recognition, stopRecognising }
    } else {
        console.log("Speech recognition not supported 😢");
        speechRecognitionError = "Speech recognition not supported 😢";
        onSpeechRecognitionError("Speech recognition not supported 😢");
        // code to handle error
    }
}