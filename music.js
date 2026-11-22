/* "A Pocket Full of Paper Hearts", an original 16-bar waltz for Axel and Swayze. */
(() => {
  "use strict";

  const sampleRate = 24000;
  const beatsPerBar = 3;
  const beatSeconds = 60 / 94;
  const fadeIn = 0.18;
  const fadeOut = 0.16;
  const score = [
    [48, [55, 60, 64, 67], [[0, 76, .65], [1, 79, .44], [1.5, 81, .44], [2, 79, .8]]],
    [47, [55, 59, 62, 67], [[0, 74, .7], [1, 71, .44], [1.5, 74, .44], [2, 79, .9]]],
    [45, [57, 60, 64, 67], [[0, 76, .9], [1.5, 72, .44], [2, 74, .44], [2.5, 76, .35]]],
    [40, [55, 59, 62, 64], [[0, 71, 1.1], [1.5, 67, .83]]],
    [41, [57, 60, 64, 65], [[0, 72, .85], [1, 76, .44], [1.5, 77, .44], [2, 81, .82]]],
    [40, [55, 60, 62, 64], [[0, 79, .9], [1.5, 76, .44], [2, 74, .44], [2.5, 72, .35]]],
    [38, [53, 57, 60, 65], [[0, 69, .85], [1, 72, .7], [2, 77, .85]]],
    [43, [55, 59, 62, 65], [[0, 74, .85], [1, 71, .9], [2.5, 74, .37]]],
    [48, [55, 60, 64, 67], [[0, 76, .65], [1, 79, .44], [1.5, 81, .44], [2, 84, .85]]],
    [40, [55, 59, 62, 64], [[0, 83, .8], [1, 79, .44], [1.5, 76, .44], [2, 74, .88]]],
    [41, [57, 60, 64, 65], [[0, 77, .6], [1, 81, .44], [1.5, 84, .43], [2, 81, .8]]],
    [43, [55, 59, 62, 67], [[0, 79, 1], [1.5, 74, .44], [2, 76, .44], [2.5, 79, .35]]],
    [45, [57, 60, 64, 69], [[0, 81, .8], [1, 76, .8], [2, 72, .8]]],
    [38, [53, 57, 60, 65], [[0, 77, .7], [1, 76, .45], [1.5, 72, .45], [2, 74, .85]]],
    [43, [55, 59, 62, 65], [[0, 71, .72], [1, 74, .72], [2, 79, .82]]],
    [48, [55, 60, 64, 67], [[0, 84, .8], [1, 79, .7], [2, 76, .8]]]
  ];
  const arpeggio = [1, 2, 0, 3, 2];
  const buffers = new WeakMap();
  let current = null;

  function partial(angle, amplitude, decay) {
    const damping = Math.exp(-decay / sampleRate);
    return {
      sine: 0,
      cosine: amplitude,
      stepSine: Math.sin(angle) * damping,
      stepCosine: Math.cos(angle) * damping
    };
  }

  function render(context) {
    const loopSamples = Math.round(score.length * beatsPerBar * beatSeconds * sampleRate);
    const buffer = context.createBuffer(1, loopSamples, sampleRate);
    const samples = buffer.getChannelData(0);

    function note(midi, beat, duration, volume, voice) {
      const start = Math.round(beat * beatSeconds * sampleRate);
      const length = Math.round(duration * beatSeconds * sampleRate);
      const angle = 2 * Math.PI * 440 * Math.pow(2, (midi - 69) / 12) / sampleRate;
      const attack = voice === "lead" ? 0.009 : 0.014;
      const release = voice === "bass" ? 0.07 : 0.06;
      const decay = voice === "bass" ? 2.8 : 4.6;
      const spectrum = [partial(angle, 1, decay)];
      if (voice === "lead") {
        spectrum.push(partial(angle * 2.01, .29, decay + 12), partial(angle * 3, .135, decay + 3.5));
      } else {
        spectrum.push(partial(angle * 3, -.12, decay));
      }
      let index = start % loopSamples;
      for (let i = 0; i < length; i++) {
        const edge = Math.min(1, i / (attack * sampleRate), (length - i - 1) / (release * sampleRate));
        const shape = edge * edge * (3 - 2 * edge);
        let wave = 0;
        // A damped phase rotation advances each sinusoid one sample at a time.
        for (const harmonic of spectrum) {
          const { sine, cosine, stepSine, stepCosine } = harmonic;
          wave += sine;
          harmonic.sine = sine * stepCosine + cosine * stepSine;
          harmonic.cosine = cosine * stepCosine - sine * stepSine;
        }
        samples[index] += volume * shape * wave;
        index++;
        if (index === loopSamples) index = 0;
      }
    }

    for (const [bar, [bass, chord, melody]] of score.entries()) {
      const beat = bar * beatsPerBar;
      note(bass, beat, 1.28, .026, "bass");
      note(bass + 12, beat + 2, .76, .012, "bass");
      for (const [step, degree] of arpeggio.entries()) {
        note(chord[degree], beat + .5 + step * .5, .66, step % 2 ? .025 : .018, "arp");
      }
      for (const [offset, pitch, duration] of melody) {
        note(pitch, beat + offset, duration + .14, offset === 0 ? .051 : .044, "lead");
        note(pitch, beat + offset + .38, Math.min(duration, .6), .006, "arp");
      }
    }

    const peak = samples.reduce((high, sample) => Math.max(high, Math.abs(sample)), 0);
    const scale = .082 / peak;
    for (let i = 0; i < samples.length; i++) samples[i] *= scale;
    return buffer;
  }

  function stop() {
    if (!current) return;
    const { context, source, gain, began } = current;
    current = null;
    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.min(1, Math.max(0, (now - began) / fadeIn)), now);
    gain.gain.linearRampToValueAtTime(0, now + fadeOut);
    source.stop(now + fadeOut);
  }

  function start(context, output = context.destination) {
    if (current?.context === context && current.output === output) return;
    stop();
    let buffer = buffers.get(context);
    if (!buffer) {
      buffer = render(context);
      buffers.set(context, buffer);
    }

    const source = context.createBufferSource();
    const gain = context.createGain();
    const now = context.currentTime;
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    gain.connect(output);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + fadeIn);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
    source.start(now);
    current = { context, output, source, gain, began: now };
  }

  window.PaperMusic = Object.freeze({ start, stop });
})();
