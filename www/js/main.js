var currentElt;
var recorder;
var audio_context;

$(function() {


    function startUserMedia(stream) {
        var input = audio_context.createMediaStreamSource(stream);
        console.log('Media stream created.');
        // Uncomment if you want the audio to feedback directly
        //input.connect(audio_context.destination);
        //__log('Input connected to audio context destination.');

        recorder = new Recorder(input, {
            workerPath: "js/recorderWorker.js"
        });
        console.log('Recorder initialised.');
    }


    // webkit shim
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
    window.URL = window.URL || window.webkitURL;

    audio_context = new AudioContext;
    console.log('Audio context set up.');
    console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));


    navigator.getUserMedia({
        audio: true
    }, startUserMedia, function(e) {
        console.log('No live audio input: ' + e);
    });


    $("#grid").isotope();
    $("#control").toggle();
    $(".thumb").click(function() {
        currentElt = $(this);
        if (recorder !== undefined)
            recorder.clear();
        if (currentElt.hasClass("thumb")) {
            $(".thumb").each(function() {
                this.pause();
                this.loop = 0;
                this.currentTime = 0;
                this.onended = ended;
            });
            currentElt.toggleClass("thumb player");
            $("#grid").isotope({
                filter: ".player"
            });

            currentElt.animate({
                width: "1120px",
                height: "840px",
            }, 500, function() {
                $("#control").toggle(300);
            });
        }
    });
});


function play() {
    if (currentElt !== undefined) {
        currentElt[0].play();
    }
}

function dub() {
    if (currentElt !== undefined) {
        currentElt[0].play();
        recorder.record();
    }

}

function review() {
    if (currentElt !== undefined) {
        recorder.getBuffer(function(buffers) {
            var newSource = audio_context.createBufferSource();
            var newBuffer = audio_context.createBuffer(2, buffers[0].length, audio_context.sampleRate);
            newBuffer.getChannelData(0).set(buffers[0]);
            newBuffer.getChannelData(1).set(buffers[1]);
            newSource.buffer = newBuffer;

            newSource.connect(audio_context.destination);
            newSource.start(0);
            currentElt[0].play();
        });

    }
}

var ended = function ended() {
    recorder.stop();
    currentElt[0].currentTime = 0;
    console.log("ended");
}

function cancel() {
    if (currentElt !== undefined) {
        $("#control").toggle(300);
        currentElt.animate({
            width: "480px",
            height: "360px",
        }, 500, function() {
            currentElt.toggleClass("thumb player");
            $("#grid").isotope({
                filter: ".thumb"
            });
            $(".thumb").each(function() {
                this.play();
            });
        });

    }
}
