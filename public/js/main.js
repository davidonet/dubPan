var currentElt;
var recorder;
var audio_context;
var isDubPressed = false;

$(function() {


    function startUserMedia(stream) {
        var input = audio_context.createMediaStreamSource(stream);
        console.log("Media stream created.");
        // Uncomment if you want the audio to feedback directly
        //input.connect(audio_context.destination);
        //__log('Input connected to audio context destination.');

        recorder = new Recorder(input, {
            workerPath: "js/recorderWorker.js",
            numChannels: 1

        });
        console.log('Recorder initialised.');
    }


    // webkit shim
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
    window.URL = window.URL || window.webkitURL;

    audio_context = new AudioContext();
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

        if (currentElt.hasClass("thumb")) {

            $(".thumb").each(function() {
                this.pause();
                this.loop = 0;
                this.currentTime = 0;
            });

            if (recorder !== undefined)
                recorder.clear();

            currentElt[0].onended = function ended() {
                $("#bplay,#bdub").removeAttr("disabled");
                if (isDubPressed) {
                    $("#brev,#bpub").removeAttr("disabled");
                }

                recorder.stop();
                currentElt[0].currentTime = 0;
                console.log("player ended");
            };

            isDubPressed = false;

            $("#bdub,#brev,#bpub").attr("disabled", "disabled");
            $("#bplay").removeAttr("disabled");
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
        $("#bplay,#bdub,#brev,#bpub").attr("disabled", "disabled");
        currentElt[0].play();
    }
}

function dub() {
    if (currentElt !== undefined) {
        $("#bplay,#bdub,#brev,#bpub").attr("disabled", "disabled");
        currentElt[0].play();
        recorder.record();
        isDubPressed = true;
    }

}

function review() {
    if (currentElt !== undefined) {
        $("#bplay,#bdub,#brev,#bpub").attr("disabled", "disabled");
        recorder.getBuffer(function(buffers) {
            var newSource = audio_context.createBufferSource();
            var newBuffer = audio_context.createBuffer(1, buffers[0].length, audio_context.sampleRate);
            newBuffer.getChannelData(0).set(buffers[0]);
            newSource.buffer = newBuffer;
            newSource.connect(audio_context.destination);
            newSource.start(0);
            currentElt[0].play();
        });

    }
}

function cancel() {
    if (currentElt !== undefined) {
        if (recorder !== undefined)
            recorder.stop();
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
                this.loop = -1;
            });
        });

    }
}

function publish() {
    recorder.exportWAV(function(b64) {
        form = new FormData();
        form.append("video", currentElt.attr('id'));
        form.append("sound", b64, "audiodub");
        console.log(form);
        request = new XMLHttpRequest();

        request.upload.addEventListener("progress", function(oEvent) {
            if (oEvent.lengthComputable) {
                var percentComplete = 100 * (oEvent.loaded / oEvent.total);
                $("#uploadprogress").css({
                    width: percentComplete + "%"
                });
            } else {

            }
        });

        request.onload = function() {
            $("#progress").hide();
            $("#dplink").text("http://p4n.it/" + JSON.parse(this.responseText).dpid);
            $("#dplink").fadeIn();
            $("#uploadprogress").css({
                width: "0%"
            });
            setTimeout(function() {
                $('#linkbox').fadeOut();
                cancel();
            }, 8000);
        };

        request.open(
            "POST",
            "/upload",
            true
        );

        $("#progress").show();
        $("#dplink").hide();
        $('#linkbox').fadeIn();
        request.send(form);


    });
}
