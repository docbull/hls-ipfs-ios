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

    // loads manifest file from ipfs node, however, it cannot load
    // segments of the video...
    let chunk = await loadChunk(`${CID}/master.m3u8`);
    let length = 0, offset = 0;
    const parts = [];
    parts.push(chunk);
    length += chunk.length;
    const value = new Uint8Array(length);
    for (const buf of parts) {
      value.set(buf, offset);
    }
    const blob = new Blob(value);
    video.src = URL.createObjectURL(blob);
  } else {
    const message = document.createTextNode('📼 Sorry, your browser does not support HLS');
    console.log(message);
  }
}

// loadChunk requests video segment using CID and segment name to IPFS nodes.
async function loadChunk(CID) {
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