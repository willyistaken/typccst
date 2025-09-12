/* eslint-env browser */

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from 'y-monaco'
import * as monaco from 'monaco-editor'
import { $typst } from '@myriaddreamin/typst.ts';


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

window.addEventListener('load', () => {
	console.log("hello");
  const ydoc = new Y.Doc()
  const provider = new WebsocketProvider(
    'wss://localhost:8080', // use the public ws server
    // `ws${location.protocol.slice(4)}//${location.host}/ws`, // alternatively: use the local ws server (run `npm start` in root directory)
    roomname,
    ydoc
  )
  const ytext = ydoc.getText('monaco')

  const editor = monaco.editor.create(/** @type {HTMLElement} */ (document.getElementById('monaco-editor')), {
    value: '',
    language: 'javascript',
    theme: 'vs-dark'
  })
  const monacoBinding = new MonacoBinding(ytext, /** @type {monaco.editor.ITextModel} */ (editor.getModel()), new Set([editor]), provider.awareness)

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




  // update preview whenever editor changes
  editor.onDidChangeModelContent(() => {
	const mainContent = editor.getValue()
    preview.textContent = await $typst.svg({ mainContent });
  })

  // initialize preview with current content
  preview.textContent = editor.getValue()


  // @ts-ignore
  window.example = { provider, ydoc, ytext, monacoBinding }

})
