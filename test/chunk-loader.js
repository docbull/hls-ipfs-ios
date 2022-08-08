import { IPFSHlsMultiChunk } from './hls-ipfs-loader.js';

// initIPFS gets video chunks from IPFS using it's own CID. 
async function initIPFS(CID) {
  Hls.DefaultConfig.loader = IPFSHlsMultiChunk;
  Hls.DefaultConfig.debug = false;
  const video = document.getElementById('video');
  var options = {
    controls: true,
    autoplay: true,
    preload: 'auto'
  };
  var player = videojs(video, options);

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.config.ipfsHash = CID;
    hls.loadSource('master.m3u8');
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      player.mediainfo = player.mediainfo || {};
      player.mediainfo.projection = '360';
      // var vr = window.vr = player.vr({projection: 'AUTO', debug: true, forceCardboard: false});
      player.play();
      
      console.log(hls.stats);
      video.play();
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // window.alert("iOS is not supported yet, coming soon");

    // let videoSource = `https://203.247.240.228:8000/hls-badguy/master.m3u8`;
    // let videoSource = `https://203.247.240.228:8000/md_10/dash.mpd`;
    let chunk = await loadChunk(`${CID}/master.m3u8`);
    let length = 0, offset = 0;
    const parts = [];
    parts.push(chunk);
    length += chunk.length;
    const value = new Uint8Array(length);
    for (const buf of parts) {
      value.set(buf, offset);
    }
    console.log(value);
    const blob = new Blob(value);
    video.src = URL.createObjectURL(blob);

    // video.addEventListener('progress', (event) => {
    //   console.log(video.srcObject);
    // })

    // let chunk = await loadChunk(`${CID}/master.m3u8`);
    // video.src = chunk;
  } else {
    const message = document.createTextNode('📼 Sorry, your browser does not support HLS');
    window.alert(message);
  }
}

// loadChunk requests video segment using CID and segment name to IPFS nodes.
async function loadChunk(CID) {
  // IPFS download scheduling would be here. -> 🧙‍♂️ docbull watson
  return new Promise((resolve) => {
    fetch(`/load`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      responseType: "blob",
      redirect: "follow",
      body: JSON.stringify({
        CID: CID
    })
    })
    .then((res) => res.blob())
    .then((data) => {
      data.arrayBuffer()
      .then((result) => {
        let uint = new Uint8Array(result);
        resolve(uint);
      })
    })
  })
}

export { initIPFS, loadChunk }