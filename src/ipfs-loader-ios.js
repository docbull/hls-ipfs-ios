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
    window.alert("iOS is not supported yet, coming soon");

    // iOS does not support Media Source Extensions ...
    let videoSource = '';
    video.src = videoSource;
  } else {
    const message = document.createTextNode('📼 Sorry, your browser does not support HLS');
    console.log(message);
  }
}

export { initIPFS }