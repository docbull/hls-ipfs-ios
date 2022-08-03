import { HlsIpfsLoader } from './hls-ipfs-loader.js';

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
      video.play();
    });

  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
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