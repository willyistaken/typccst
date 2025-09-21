/* eslint-env browser */

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from 'y-monaco'
import * as monaco from 'monaco-editor'
import { initVimMode } from 'monaco-vim'


// // @ts-ignore
// window.MonacoEnvironment = {
//   getWorkerUrl: function (moduleId, label) {
//     if (label === 'json') {
//       return '/monaco/dist/json.worker.bundle.js'
//     }
//     if (label === 'css') {
//       return '/monaco/dist/css.worker.bundle.js'
//     }
//     if (label === 'html') {
//       return '/monaco/dist/html.worker.bundle.js'
//     }
//     if (label === 'typescript' || label === 'javascript') {
//       return '/monaco/dist/ts.worker.bundle.js'
//     }
//     return '/monaco/dist/editor.worker.bundle.js'
//   }
// }

const roomname = `monaco-demo-${new Date().toLocaleDateString('en-CA')}`
let editor;

window.addEventListener('load',  () => {
  const ydoc = new Y.Doc()
  const provider = new WebsocketProvider(
    `ws://${window.location.hostname}:12345`,
    // 'ws://ws1.csie.ntu.edu.tw:12345', // use the public ws server
    // 'ws://localhost:12345', 
    // `ws${location.protocol.slice(4)}//${location.host}/ws`, // alternatively: use the local ws server (run `npm start` in root directory)
    roomname,
    ydoc
  )
  const ytext = ydoc.getText('monaco')

  editor = monaco.editor.create(/** @type {HTMLElement} */ (document.getElementById('monaco-editor')), {
    value: '',
    language: 'typst',
    theme: 'vs-dark'
  })
  const monacoBinding = new MonacoBinding(ytext, /** @type {monaco.editor.ITextModel} */ (editor.getModel()), new Set([editor]), provider.awareness)

  const statusNode = document.getElementById('vim-status-bar'); // A div to display mode status (e.g., 'NORMAL')
  const vimCommandNode = document.getElementById('vim-command-bar');
let vimMode = null;
let vimEnabled = false;

document.getElementById("vim-toggle").addEventListener("click", () => {
  if (vimEnabled) {
    // turn off vim
    vimMode.dispose();
    vimMode = null;
    vimEnabled = false;
    statusNode.textContent = "Vim OFF";
  } else {
    // turn on vim
    vimMode = initVimMode(editor, vimCommandNode);
    vimEnabled = true;
    statusNode.textContent = "Vim ON";
  }
  if (vimMode) {
    console.log('Vim mode successfully initialized.');
  }else{
			console.log('vim mode deactivated');
	}
});

  const connectBtn = /** @type {HTMLElement} */ (document.getElementById('y-connect-btn'))
  connectBtn.addEventListener('click', () => {
    if (provider.shouldConnect) {
      provider.disconnect()
      connectBtn.textContent = 'Connect'
    } else {
      provider.connect()
      connectBtn.textContent = 'Disconnect'
    }
	console.log(editor.getValue())
  })

   const preview = document.getElementById('preview')



	
  // @ts-ignore
  window.example = { provider, ydoc, ytext, monacoBinding }

})



// :-> 7317


const renderBtn = document.getElementById("render-btn");
const preview   = document.getElementById("preview");

    const contentDiv = document.getElementById('content');

    // Exports SVG and puts it into the `contentDiv`
    const previewSvg = mainContent => {
      $typst.svg({ mainContent }).then(svg => {
        console.log(`rendered! SvgElement { len: ${svg.length} }`);
        // append svg text
        preview.innerHTML = svg;

      });
    };

    // Exports PDF and downloads it
    const exportPdf = mainContent =>
      $typst.pdf({ mainContent }).then(pdfData => {
        var pdfFile = new Blob([pdfData], { type: 'application/pdf' });

        // Creates element with <a> tag
        const link = document.createElement('a');
        // Sets file content in the object URL
        link.href = URL.createObjectURL(pdfFile);
        // Sets file name
        link.target = '_blank';
        // Triggers a click event to <a> tag to save file.
        link.click();
        URL.revokeObjectURL(link.href);
      });



    var now_text = "";
    async function update_typst () {
      const txt = editor.getValue();
      if (now_text == txt) return;
      now_text = txt;
      exportPdf(editor.getValue());
      previewSvg(editor.getValue());
    }
    setInterval(update_typst, 500)

    /// Listens the 'load' event to initialize after loaded the bundle file from CDN (jsdelivr).
    document.getElementById('typst').addEventListener('load', function () {
      /// Initializes the Typst compiler and renderer. Since we use "all-in-one-lite.bundle.js" instead of
      /// "all-in-one.bundle.js" we need to tell that the wasm module files can be loaded from CDN (jsdelivr).
      $typst.setCompilerInitOptions({
        getModule: () =>
          'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm',
      });
      $typst.setRendererInitOptions({
        getModule: () =>
          'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm',
      });

      /// Binds exportPdf action to the button
      // document.getElementById('render-btn').onclick = update_typst;
      /// Binds previewSvg action to the textarea
      /// Triggers the first preview.
      previewSvg(editor.getValue());
    });


