document.addEventListener("DOMContentLoaded", function(event) {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const images = [
        document.getElementById("daftpunk"),
        document.getElementById("deadmau5"),
        document.getElementById("royksopp"),
        document.getElementById("fredagain")
    ]

    const subtitles = [
        "Daft Punk",
        "Deadmau5",
        "Royksopp",
        "Fred Again"
    ]

    const subtitlediv = document.getElementById("subtitle");

    hideImages();

    const sinebutton = document.getElementById("sine");
    const sawtoothbutton = document.getElementById("sawtooth");
    const squarebutton = document.getElementById("square");
    const trianglebutton = document.getElementById("triangle");
    const globalGain = audioCtx.createGain(); //this will control the volume of all notes
    globalGain.gain.setValueAtTime(0.2, audioCtx.currentTime)
    globalGain.connect(audioCtx.destination);
    let type = "sine";
    sinebutton.addEventListener("click", function() {
        type = "sine";
    });

    sawtoothbutton.addEventListener("click", function() {
        type = "sawtooth";
    });
    squarebutton.addEventListener("click", function() {
        type = "square";
    });
    trianglebutton.addEventListener("click", function() {
        type = "triangle";
    });


    let synthesistype = "none";

    const synthselect = document.getElementById("synthesis_type");
    synthselect.addEventListener("change", function() {
        if (synthselect.value === "additive") {
            synthesistype = "additive";
        } else if (synthselect.value === "am") {
            synthesistype = "AM";
        } else if (synthselect.value === "fm") {
            synthesistype = "FM";
        } else {
            synthesistype = "none";
        }
    });

    let lfo_on = false;
    const lfoselect = document.getElementById("lfo");
    lfoselect.addEventListener("change", function() {
        if (lfoselect.value === "yes_lfo") {
            lfo_on = true;
        } else {
            lfo_on = false;
        }
    });

    const keyboardFrequencyMap = {
    '90': 261.625565300598634,  //Z - C
    '83': 277.182630976872096, //S - C#
    '88': 293.664767917407560,  //X - D
    '68': 311.126983722080910, //D - D#
    '67': 329.627556912869929,  //C - E
    '86': 349.228231433003884,  //V - F
    '71': 369.994422711634398, //G - F#
    '66': 391.995435981749294,  //B - G
    '72': 415.304697579945138, //H - G#
    '78': 440.000000000000000,  //N - A
    '74': 466.163761518089916, //J - A#
    '77': 493.883301256124111,  //M - B
    '81': 523.251130601197269,  //Q - C
    '50': 554.365261953744192, //2 - C#
    '87': 587.329535834815120,  //W - D
    '51': 622.253967444161821, //3 - D#
    '69': 659.255113825739859,  //E - E
    '82': 698.456462866007768,  //R - F
    '53': 739.988845423268797, //5 - F#
    '84': 783.990871963498588,  //T - G
    '54': 830.609395159890277, //6 - G#
    '89': 880.000000000000000,  //Y - A
    '55': 932.327523036179832, //7 - A#
    '85': 987.766602512248223,  //U - B
    }

    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);

    const activeOscillators = {}

    function keyDown(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
            if (synthesistype === "additive") {
                additiveSynthesis(key);
            } else if (synthesistype === "AM") {
                AMSynthesis(key);
            } else if (synthesistype === "FM") {
                FMSynthesis(key);
            } else {
                playNote(key);
            }
        }


        if (keyboardFrequencyMap[key] < 360) {
            showImage(0);
        } else if (keyboardFrequencyMap[key] < 500 && keyboardFrequencyMap[key] >= 360) {
            showImage(1);
        } else if (keyboardFrequencyMap[key] < 700 && keyboardFrequencyMap[key] >= 500) {
            showImage(2);
        } else if (keyboardFrequencyMap[key] < 1000 && keyboardFrequencyMap[key] >= 700) {
            showImage(3);
        }


    }

    function keyUp(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            activeOscillators[key].gainNode.gain.setValueAtTime(activeOscillators[key].gainNode.gain.value, audioCtx.currentTime);
            activeOscillators[key].gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5); //decay
            for (let osc of activeOscillators[key].oscillator) {
                osc.stop(audioCtx.currentTime + 0.5);
            }
            delete activeOscillators[key];
            hideImages();
            
        }
    }


    

    function playNote(key) {
        const osc = audioCtx.createOscillator();
        osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)
        osc.type = type //choose your favorite waveform

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);
        osc.connect(gainNode).connect(globalGain) //you will need a new gain node for each node to control the adsr of that note
        gainNode.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.4); //attack

        osc.start();
        activeOscillators[key] = {oscillator: [osc], gainNode: gainNode};
    }


    function additiveSynthesis(key) {
        let oscillators = [];
        const additiveGain = audioCtx.createGain();
        additiveGain.gain.value = 0.0001;


        for (let i = 1; i <= 5; i++) {
            const osc = audioCtx.createOscillator();
            osc.frequency.setValueAtTime(keyboardFrequencyMap[key] * i, audioCtx.currentTime);
            osc.connect(additiveGain);
            osc.type = type;
            
            oscillators.push(osc);
        }
        additiveGain.connect(globalGain);
        additiveGain.gain.setTargetAtTime(0.10, audioCtx.currentTime, 0.2);
        //additiveGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime + 0.2, 1);
        oscillators.forEach(osc => osc.start());

        activeOscillators[key] = {oscillator: oscillators, gainNode: additiveGain};
        

    }

    function AMSynthesis(key) {
        let carrier = audioCtx.createOscillator();
        carrier.frequency.value = keyboardFrequencyMap[key];
        carrier.type = type;
        let modulatorFreq = audioCtx.createOscillator();
        modulatorFreq.frequency.setValueAtTime(100, audioCtx.currentTime);
        modulatorFreq.type = type;

        const modulatorGain = audioCtx.createGain();
        let depth = audioCtx.createGain();
        let depth_value = document.getElementById("am_depth").value;
        depth.gain.setValueAtTime(depth_value, audioCtx.currentTime);
        modulatorGain.gain.setValueAtTime(1-depth_value, audioCtx.currentTime);
        modulatorFreq.connect(depth).connect(modulatorGain.gain);


        
        carrier.connect(modulatorGain);
        modulatorGain.connect(globalGain);

        modulatorGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
        modulatorGain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.5);
        
        carrier.start();
        modulatorFreq.start();
        activeOscillators[key] = {oscillator: [carrier, modulatorFreq], gainNode: modulatorGain};

        
        if (lfo_on) {
            var lfo = audioCtx.createOscillator();
            lfo.frequency.setValueAtTime(2, audioCtx.currentTime+0.05);
            let lfoGain = audioCtx.createGain();
            lfoGain.gain.setValueAtTime(5, audioCtx.currentTime + 0.05);
            lfo.connect(lfoGain).connect(carrier.frequency);
            lfo.start();
            activeOscillators[key].oscillator.push(lfo);
        }
    }

    function FMSynthesis(key) {
        let carrier = audioCtx.createOscillator();
        carrier.frequency.value = keyboardFrequencyMap[key];
        carrier.type = type;
        let modulator = audioCtx.createOscillator();
        modulator.type = type;
        let modulationIndex = audioCtx.createGain();
        modulationIndex.gain.setValueAtTime(5, audioCtx.currentTime + 0.05);
        modulator.frequency.setValueAtTime(100, audioCtx.currentTime + 0.05);

        modulator.connect(modulationIndex);
        modulationIndex.connect(carrier.frequency);


        let modGain = audioCtx.createGain();
        modGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
        modGain.gain.exponentialRampToValueAtTime(1, audioCtx.currentTime + 0.5);
        carrier.connect(modGain).connect(globalGain);

        carrier.start();
        modulator.start();
        activeOscillators[key] = {oscillator: [carrier, modulator], gainNode: modGain};

        if (lfo_on) {
            var lfo = audioCtx.createOscillator();
            lfo.frequency.setValueAtTime(2, audioCtx.currentTime);
            let lfoGain = audioCtx.createGain();
            lfoGain.gain.setValueAtTime(10, audioCtx.currentTime);
            lfo.connect(lfoGain).connect(carrier.frequency);
            lfo.start();
            activeOscillators[key].oscillator.push(lfo);
        }
    }

    function hideImages() {
        images.forEach(img => {
            img.style.display = "none";

        });
        subtitlediv.style.display = "none";
    }

    function showImage(index) {
        hideImages();
        images[index].style.display = "block";
        subtitlediv.textContent = subtitles[index];
        subtitlediv.style.display = "block";
    }




});

