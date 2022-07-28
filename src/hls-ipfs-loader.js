'use strict'

let cnt = 0;
let receivedData = 0;
let segmentNum = 0;
let last = 0;
const video = document.getElementById('video');
let consumedData = video.webkitVideoDecodedByteCount/1024/1024 + video.webkitAudioDecodedByteCount/1024/1024;
setInterval(() => {
  console.log(`%ctime: ${cnt}`, 'color:orange;');
  console.log(`%cReceived data: ${receivedData/1024/1024}`, 'color:orange;');
  consumedData = video.webkitVideoDecodedByteCount/1024/1024 + video.webkitAudioDecodedByteCount/1024/1024;
  console.log(`%cConsumed data: ${consumedData}`, 'color:orange;');
  // console.log(`%cBitrate: ${(consumedData - last) * 8}`, 'color:blue;');
  // last = consumedData;
  cnt++;
}, 1000);

class HlsIpfsLoader {
    constructor(config) {
        this.multiChunkReq = 5;
        this._abortFlag = [ false ];
        this.ipfs = config.ipfs
        this.hash = config.ipfsHash
        if (config.debug === false) {
        this.debug = function() {}
        } else if (config.debug === true) {
        this.debug = console.log
        } else {
        this.debug = config.debug
        }
        if(config.m3u8provider) {
        this.m3u8provider = config.m3u8provider;
        } else {
        this.m3u8provider = null;
        }
        if(config.tsListProvider) {
        this.tsListProvider = config.tsListProvider;
        } else {
        this.tsListProvider = null;
        }
    }

    destroy() {
    }

    abort() {
        this._abortFlag[0] = true;
    }

    load(context, config, callbacks) {
        this.context = context
        this.config = config
        this.callbacks = callbacks
        this.stats = { trequest: performance.now(), retry: 0 }
        this.retryDelay = config.retryDelay
        this.loadInternal()
    }
    /**
     * Call this by getting the HLSIPFSLoader instance from hls.js hls.coreComponents[0].loaders.manifest.setM3U8Provider()
     * @param {function} provider
     */
    setM3U8Provider(provider) {
        this.m3u8provider = provider;
    }
    /**
     *
     * @param {function} provider
     */
    setTsListProvider(provider) {
        this.tsListProvider = provider;
    }

    loadInternal() {
        const { multiChunkReq, stats, context, callbacks } = this

        stats.tfirst = Math.max(performance.now(), stats.trequest)
        stats.loaded = 0

        //When using absolute path (https://example.com/index.html) vs https://example.com/
        const urlParts = window.location.href.split("/")
        if(urlParts[urlParts.length - 1] !== "") {
            urlParts[urlParts.length - 1] = ""
        }
        const filename = context.url.replace(urlParts.join("/"), "")

        const options = {}
        if (Number.isFinite(context.rangeStart)) {
            options.offset = context.rangeStart;
            if (Number.isFinite(context.rangeEnd)) {
                options.length = context.rangeEnd - context.rangeStart;
            }
        }

        if(filename.split(".")[1] === "m3u8" && this.m3u8provider !== null) {
            const res = this.m3u8provider();
            let data;
            if(Buffer.isBuffer(res)) {
                data = buf2str(res)
            } else {
                data = res;
            }
            const response = { url: context.url, data: data }
            callbacks.onSuccess(response, stats, context)
            return;
        }
        if(filename.split(".")[1] === "m3u8" && this.tsListProvider !== null) {
            var tslist = this.tsListProvider();
            var hash = tslist[filename];
            if(hash) {
                this.cat(hash).then(res => {
                let data;
                if(Buffer.isBuffer(res)) {
                    data = buf2str(res)
                } else {
                    data = res;
                }
                stats.loaded = stats.total = data.length
                stats.tload = Math.max(stats.tfirst, performance.now())
                const response = { url: context.url, data: data }
                callbacks.onSuccess(response, stats, context)
            });
        }
        return;
    }

    let start = performance.now()
    this._abortFlag[0] = false;
    getFile(this.ipfs, this.hash, filename, options, this.debug, this._abortFlag).then(res => {
        const data = (context.responseType === 'arraybuffer') ? res : buf2str(res)
        stats.loaded = stats.total = data.length
        stats.tload = Math.max(stats.tfirst, performance.now())
        const response = { url: context.url, data: data }

        ///////////////////////////////////////////////
        let end = performance.now()
        receivedData += stats.loaded;
        stats.bwEstimate = stats.loaded / (end - start)
        console.log(`%csegment #${segmentNum}: ${stats.bwEstimate/1024}`, 'color: green;');
        segmentNum++;

        callbacks.onSuccess(response, stats, context)
    }, console.error)
  }
}
async function getFile(ipfs, rootHash, filename, options, debug, abortFlag) {
    debug(`Fetching hash for '${rootHash}/${filename}'`)
    const path = `${rootHash}/${filename}`
    try {
        return await cat(path, options, ipfs, debug, abortFlag)
    } catch(ex) {
        console.log(ex);
        throw new Error(`File not found: ${rootHash}/${filename}`)
    }
}

function buf2str(buf) {
    return new TextDecoder().decode(buf)
}

// cat runs IPFS cat in browser. The browser will retrieve chunks from IPFS preload
// nodes that relay the chunks because IPFS node running on browser doesn't support
// direct connection with IPFS network.
async function cat(cid, options, ipfs, debug, abortFlag) {
    let start = new Date()
    const parts = []
    let length = 0, offset = 0

    // Run IPFS cat within IPFS node in the browser, and it pushs the data in the buffer
    // to playback the video.
    // let units = await loadChunk(cid);

    parts.push(units);
    length += units.length;
    if (abortFlag[0]) {
        debug('Cancel reading from ipfs')
    }

    const value = new Uint8Array(length)
    for (const buf of parts) {
        value.set(buf, offset)
        offset += buf.length
    }

    let end = new Date();
    console.log(`📥 ${cid} IPFS cat latency: ${end-start}ms`);
    debug(`Received data for file '${cid}' size: ${value.length} in ${parts.length} blocks`)
    return value
}

export { HlsIpfsLoader }