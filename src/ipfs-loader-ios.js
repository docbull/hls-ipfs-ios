import { HlsIpfsLoader } from './hls-ipfs-loader.js';

let frozen = 0;
let cnt = 0;

setInterval(() => {
  cnt++;
}, 1000);

// initIPFS gets video chunks from IPFS using it's own CID. 
async function initIPFS(CID) {
  Hls.DefaultConfig.loader = HlsIpfsLoader;
  Hls.DefaultConfig.debug = false;
  const video = document.getElementById('video');

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.config.ipfsHash = CID;
    hls.loadSource('master.m3u8');
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log(hls.stats);
      video.play();
    });
    video.addEventListener('waiting', (event) => {
      frozen++;
      console.log(`Frozen event is triggered at ${cnt}; ${frozen}`);
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // let videoSource = await loadChunk(`${CID}/master.m3u8`);
    let videoSource = '';
    // var ms = new MediaSource();
    // video.src = window.URL.createObjectURL(ms);
    // ms.addEventListener('sourceopen', function (e) {
    //   var sourceBuffer = ms.addSourceBuffer('video/webm; codecs')
    // })
    
    video.src = videoSource;
    window.alert("iOS is not supported yet, coming soon");
  } else {
    const message = document.createTextNode('📼 Sorry, your browser does not support HLS');
    console.log(message);
  }
}

export { initIPFS }