/*
 * Bundled tar, minipass, zlib, and yallist runtime used for archive mutation.
 */

import { randomBytes as payloadTarballRandomBytes } from "crypto";
import { createWriteStream as payloadTarballCreateWriteStream } from "fs";
import * as payloadTarballFsPromises from "fs/promises";
import * as payloadTarballPath from "path";
import { pipeline as payloadTarballPipeline } from "stream/promises";
import eventsModule from "events";
import streamFs from "fs";
import { EventEmitter as streamEventEmitter } from "events";
import streamModule from "stream";
import { StringDecoder as streamStringDecoder } from "string_decoder";
import tarCreatePath from "path";
import tarListFs from "fs";
import { dirname as pathDirname, parse as pathParse } from "path";
import { EventEmitter as parserEventEmitter } from "events";
import zlibAssert from "assert";
import { Buffer as zlibBuffer } from "buffer";
import * as zlibModule from "zlib";
import zlibConstantsModule from "zlib";
import { posix as posixPath } from "path";
import { basename as pathBasename } from "path";
import packFs from "fs";
import writeEntryFs from "fs";
import writeEntryPath from "path";
import { win32 as win32Path } from "path";
import packPath from "path";
import unpackFileFs from "fs";
import unpackAssert from "assert";
import { randomBytes as extractRandomBytes } from "crypto";
import unpackFs from "fs";
import unpackPath from "path";
import writeOpenFs from "fs";
import chownFs from "fs";
import chownPath from "path";
import mkdirFs from "fs";
import mkdirFsPromises from "fs/promises";
import mkdirPath from "path";
import { join as reservationPathJoin } from "path";
import replaceFs from "fs";
import replacePath from "path";
var tarDefineProperty = Object.defineProperty,
  defineTarExports = (tarExportTarget, tarExportGetters) => {
    for (var tarExportName in tarExportGetters)
      tarDefineProperty(tarExportTarget, tarExportName, {
        get: tarExportGetters[tarExportName],
        enumerable: true,
      });
  },
  processShim =
    typeof process == "object" && process
      ? process
      : { stdout: null, stderr: null },
  isStream = (streamCandidate) =>
    !!streamCandidate &&
    typeof streamCandidate == "object" &&
    (streamCandidate instanceof Minipass ||
      streamCandidate instanceof streamModule ||
      isNodeReadableStream(streamCandidate) ||
      isNodeWritableStream(streamCandidate)),
  isNodeReadableStream = (readableStreamCandidate) =>
    !!readableStreamCandidate &&
    typeof readableStreamCandidate == "object" &&
    readableStreamCandidate instanceof streamEventEmitter &&
    typeof readableStreamCandidate.pipe == "function" &&
    readableStreamCandidate.pipe !== streamModule.Writable.prototype.pipe,
  isNodeWritableStream = (writableStreamCandidate) =>
    !!writableStreamCandidate &&
    typeof writableStreamCandidate == "object" &&
    writableStreamCandidate instanceof streamEventEmitter &&
    typeof writableStreamCandidate.write == "function" &&
    typeof writableStreamCandidate.end == "function",
  eofSymbol = Symbol("EOF"),
  maybeEmitEndSymbol = Symbol("maybeEmitEnd"),
  emittedEndSymbol = Symbol("emittedEnd"),
  emittingEndSymbol = Symbol("emittingEnd"),
  emittedErrorSymbol = Symbol("emittedError"),
  closedSymbol = Symbol("closed"),
  readSymbol = Symbol("read"),
  flushSymbol = Symbol("flush"),
  flushChunkSymbol = Symbol("flushChunk"),
  encodingSymbol = Symbol("encoding"),
  decoderSymbol = Symbol("decoder"),
  flowingSymbol = Symbol("flowing"),
  pausedSymbol = Symbol("paused"),
  resumeSymbol = Symbol("resume"),
  bufferSymbol = Symbol("buffer"),
  pipesSymbol = Symbol("pipes"),
  bufferLengthSymbol = Symbol("bufferLength"),
  bufferPushSymbol = Symbol("bufferPush"),
  bufferShiftSymbol = Symbol("bufferShift"),
  objectModeSymbol = Symbol("objectMode"),
  destroyedSymbol = Symbol("destroyed"),
  errorSymbol = Symbol("error"),
  emitDataSymbol = Symbol("emitData"),
  emitEndSymbol = Symbol("emitEnd"),
  emitEnd2Symbol = Symbol("emitEnd2"),
  asyncSymbol = Symbol("async"),
  abortSymbol = Symbol("abort"),
  abortedSymbol = Symbol("aborted"),
  signalSymbol = Symbol("signal"),
  dataListenersSymbol = Symbol("dataListeners"),
  discardedSymbol = Symbol("discarded"),
  deferMicrotask = (microtaskCallback) =>
    Promise.resolve().then(microtaskCallback),
  callImmediately = (immediateCallback) => immediateCallback(),
  isEndLikeEvent = (streamEndEventName) =>
    streamEndEventName === "end" ||
    streamEndEventName === "finish" ||
    streamEndEventName === "prefinish",
  isArrayBufferLike = (arrayBufferCandidate) =>
    arrayBufferCandidate instanceof ArrayBuffer ||
    (!!arrayBufferCandidate &&
      typeof arrayBufferCandidate == "object" &&
      arrayBufferCandidate.constructor &&
      arrayBufferCandidate.constructor.name === "ArrayBuffer" &&
      arrayBufferCandidate.byteLength >= 0),
  isArrayBufferView = (arrayBufferViewCandidate) =>
    !Buffer.isBuffer(arrayBufferViewCandidate) &&
    ArrayBuffer.isView(arrayBufferViewCandidate),
  Pipe = class {
    src;
    dest;
    opts;
    ondrain;
    constructor(pipeSourceStream, pipeDestinationStream, pipeOptions) {
      (this.src = pipeSourceStream),
        (this.dest = pipeDestinationStream),
        (this.opts = pipeOptions),
        (this.ondrain = () => pipeSourceStream[resumeSymbol]()),
        this.dest.on("drain", this.ondrain);
    }
    unpipe() {
      this.dest.removeListener("drain", this.ondrain);
    }
    proxyErrors(ignoredPipeProxyError) {}
    end() {
      this.unpipe(), this.opts.end && this.dest.end();
    }
  },
  PipeProxyErrors = class extends Pipe {
    unpipe() {
      this.src.removeListener("error", this.proxyErrors), super.unpipe();
    }
    constructor(
      proxyPipeSourceStream,
      proxyPipeDestinationStream,
      proxyPipeOptions,
    ) {
      super(
        proxyPipeSourceStream,
        proxyPipeDestinationStream,
        proxyPipeOptions,
      ),
        (this.proxyErrors = (proxiedPipeError) =>
          this.dest.emit("error", proxiedPipeError)),
        proxyPipeSourceStream.on("error", this.proxyErrors);
    }
  },
  isObjectModeOption = (objectModeOptions) => !!objectModeOptions.objectMode,
  hasEncodingOption = (encodingOptions) =>
    !encodingOptions.objectMode &&
    !!encodingOptions.encoding &&
    encodingOptions.encoding !== "buffer",
  Minipass = class extends streamEventEmitter {
    [flowingSymbol] = false;
    [pausedSymbol] = false;
    [pipesSymbol] = [];
    [bufferSymbol] = [];
    [objectModeSymbol];
    [encodingSymbol];
    [asyncSymbol];
    [decoderSymbol];
    [eofSymbol] = false;
    [emittedEndSymbol] = false;
    [emittingEndSymbol] = false;
    [closedSymbol] = false;
    [emittedErrorSymbol] = null;
    [bufferLengthSymbol] = 0;
    [destroyedSymbol] = false;
    [signalSymbol];
    [abortedSymbol] = false;
    [dataListenersSymbol] = 0;
    [discardedSymbol] = false;
    writable = true;
    readable = true;
    constructor(...minipassConstructorArgs) {
      let minipassOptions = minipassConstructorArgs[0] || {};
      if (
        (super(),
        minipassOptions.objectMode &&
          typeof minipassOptions.encoding == "string")
      )
        throw TypeError("Encoding and objectMode may not be used together");
      isObjectModeOption(minipassOptions)
        ? ((this[objectModeSymbol] = true), (this[encodingSymbol] = null))
        : hasEncodingOption(minipassOptions)
          ? ((this[encodingSymbol] = minipassOptions.encoding),
            (this[objectModeSymbol] = false))
          : ((this[objectModeSymbol] = false), (this[encodingSymbol] = null)),
        (this[asyncSymbol] = !!minipassOptions.async),
        (this[decoderSymbol] = this[encodingSymbol]
          ? new streamStringDecoder(this[encodingSymbol])
          : null),
        minipassOptions &&
          minipassOptions.debugExposeBuffer === true &&
          Object.defineProperty(this, "buffer", {
            get: () => this[bufferSymbol],
          }),
        minipassOptions &&
          minipassOptions.debugExposePipes === true &&
          Object.defineProperty(this, "pipes", {
            get: () => this[pipesSymbol],
          });
      let { signal: minipassAbortSignal } = minipassOptions;
      minipassAbortSignal &&
        ((this[signalSymbol] = minipassAbortSignal),
        minipassAbortSignal.aborted
          ? this[abortSymbol]()
          : minipassAbortSignal.addEventListener("abort", () =>
              this[abortSymbol](),
            ));
    }
    get bufferLength() {
      return this[bufferLengthSymbol];
    }
    get encoding() {
      return this[encodingSymbol];
    }
    set encoding(minipassEncodingSetterValue) {
      throw Error("Encoding must be set at instantiation time");
    }
    setEncoding(minipassSetEncodingValue) {
      throw Error("Encoding must be set at instantiation time");
    }
    get objectMode() {
      return this[objectModeSymbol];
    }
    set objectMode(minipassObjectModeSetterValue) {
      throw Error("objectMode must be set at instantiation time");
    }
    get async() {
      return this[asyncSymbol];
    }
    set async(minipassAsyncSetterValue) {
      this[asyncSymbol] = this[asyncSymbol] || !!minipassAsyncSetterValue;
    }
    [abortSymbol]() {
      (this[abortedSymbol] = true),
        this.emit("abort", this[signalSymbol]?.reason),
        this.destroy(this[signalSymbol]?.reason);
    }
    get aborted() {
      return this[abortedSymbol];
    }
    set aborted(minipassAbortedSetterValue) {}
    write(minipassWriteChunk, minipassWriteEncoding, minipassWriteCallback) {
      if (this[abortedSymbol]) return false;
      if (this[eofSymbol]) throw Error("write after end");
      if (this[destroyedSymbol])
        return (
          this.emit(
            "error",
            Object.assign(
              Error("Cannot call write after a stream was destroyed"),
              { code: "ERR_STREAM_DESTROYED" },
            ),
          ),
          true
        );
      typeof minipassWriteEncoding == "function" &&
        ((minipassWriteCallback = minipassWriteEncoding),
        (minipassWriteEncoding = "utf8")),
        minipassWriteEncoding || (minipassWriteEncoding = "utf8");
      let minipassCallbackScheduler = this[asyncSymbol]
        ? deferMicrotask
        : callImmediately;
      if (!this[objectModeSymbol] && !Buffer.isBuffer(minipassWriteChunk)) {
        if (isArrayBufferView(minipassWriteChunk))
          minipassWriteChunk = Buffer.from(
            minipassWriteChunk.buffer,
            minipassWriteChunk.byteOffset,
            minipassWriteChunk.byteLength,
          );
        else {
          if (isArrayBufferLike(minipassWriteChunk))
            minipassWriteChunk = Buffer.from(minipassWriteChunk);
          else {
            if (typeof minipassWriteChunk != "string")
              throw Error(
                "Non-contiguous data written to non-objectMode stream",
              );
          }
        }
      }
      return this[objectModeSymbol]
        ? (this[flowingSymbol] &&
            this[bufferLengthSymbol] !== 0 &&
            this[flushSymbol](true),
          this[flowingSymbol]
            ? this.emit("data", minipassWriteChunk)
            : this[bufferPushSymbol](minipassWriteChunk),
          this[bufferLengthSymbol] !== 0 && this.emit("readable"),
          minipassWriteCallback &&
            minipassCallbackScheduler(minipassWriteCallback),
          this[flowingSymbol])
        : minipassWriteChunk.length
          ? (typeof minipassWriteChunk == "string" &&
              !(
                minipassWriteEncoding === this[encodingSymbol] &&
                !this[decoderSymbol]?.lastNeed
              ) &&
              (minipassWriteChunk = Buffer.from(
                minipassWriteChunk,
                minipassWriteEncoding,
              )),
            Buffer.isBuffer(minipassWriteChunk) &&
              this[encodingSymbol] &&
              (minipassWriteChunk =
                this[decoderSymbol].write(minipassWriteChunk)),
            this[flowingSymbol] &&
              this[bufferLengthSymbol] !== 0 &&
              this[flushSymbol](true),
            this[flowingSymbol]
              ? this.emit("data", minipassWriteChunk)
              : this[bufferPushSymbol](minipassWriteChunk),
            this[bufferLengthSymbol] !== 0 && this.emit("readable"),
            minipassWriteCallback &&
              minipassCallbackScheduler(minipassWriteCallback),
            this[flowingSymbol])
          : (this[bufferLengthSymbol] !== 0 && this.emit("readable"),
            minipassWriteCallback &&
              minipassCallbackScheduler(minipassWriteCallback),
            this[flowingSymbol]);
    }
    read(minipassReadSize) {
      if (this[destroyedSymbol]) return null;
      if (
        ((this[discardedSymbol] = false),
        this[bufferLengthSymbol] === 0 ||
          minipassReadSize === 0 ||
          (minipassReadSize && minipassReadSize > this[bufferLengthSymbol]))
      )
        return this[maybeEmitEndSymbol](), null;
      this[objectModeSymbol] && (minipassReadSize = null),
        this[bufferSymbol].length > 1 &&
          !this[objectModeSymbol] &&
          (this[bufferSymbol] = [
            this[encodingSymbol]
              ? this[bufferSymbol].join("")
              : Buffer.concat(this[bufferSymbol], this[bufferLengthSymbol]),
          ]);
      let minipassReadResult = this[readSymbol](
        minipassReadSize || null,
        this[bufferSymbol][0],
      );
      return this[maybeEmitEndSymbol](), minipassReadResult;
    }
    [readSymbol](minipassReadRequestSize, minipassReadChunk) {
      if (this[objectModeSymbol]) this[bufferShiftSymbol]();
      else {
        let minipassBufferedChunk = minipassReadChunk;
        minipassReadRequestSize === minipassBufferedChunk.length ||
        minipassReadRequestSize === null
          ? this[bufferShiftSymbol]()
          : typeof minipassBufferedChunk == "string"
            ? ((this[bufferSymbol][0] = minipassBufferedChunk.slice(
                minipassReadRequestSize,
              )),
              (minipassReadChunk = minipassBufferedChunk.slice(
                0,
                minipassReadRequestSize,
              )),
              (this[bufferLengthSymbol] -= minipassReadRequestSize))
            : ((this[bufferSymbol][0] = minipassBufferedChunk.subarray(
                minipassReadRequestSize,
              )),
              (minipassReadChunk = minipassBufferedChunk.subarray(
                0,
                minipassReadRequestSize,
              )),
              (this[bufferLengthSymbol] -= minipassReadRequestSize));
      }
      return (
        this.emit("data", minipassReadChunk),
        !this[bufferSymbol].length && !this[eofSymbol] && this.emit("drain"),
        minipassReadChunk
      );
    }
    end(minipassEndChunk, minipassEndEncoding, minipassEndCallback) {
      return (
        typeof minipassEndChunk == "function" &&
          ((minipassEndCallback = minipassEndChunk),
          (minipassEndChunk = void 0)),
        typeof minipassEndEncoding == "function" &&
          ((minipassEndCallback = minipassEndEncoding),
          (minipassEndEncoding = "utf8")),
        minipassEndChunk !== void 0 &&
          this.write(minipassEndChunk, minipassEndEncoding),
        minipassEndCallback && this.once("end", minipassEndCallback),
        (this[eofSymbol] = true),
        (this.writable = false),
        (this[flowingSymbol] || !this[pausedSymbol]) &&
          this[maybeEmitEndSymbol](),
        this
      );
    }
    [resumeSymbol]() {
      this[destroyedSymbol] ||
        (!this[dataListenersSymbol] &&
          !this[pipesSymbol].length &&
          (this[discardedSymbol] = true),
        (this[pausedSymbol] = false),
        (this[flowingSymbol] = true),
        this.emit("resume"),
        this[bufferSymbol].length
          ? this[flushSymbol]()
          : this[eofSymbol]
            ? this[maybeEmitEndSymbol]()
            : this.emit("drain"));
    }
    resume() {
      return this[resumeSymbol]();
    }
    pause() {
      (this[flowingSymbol] = false),
        (this[pausedSymbol] = true),
        (this[discardedSymbol] = false);
    }
    get destroyed() {
      return this[destroyedSymbol];
    }
    get flowing() {
      return this[flowingSymbol];
    }
    get paused() {
      return this[pausedSymbol];
    }
    [bufferPushSymbol](minipassBufferPushChunk) {
      this[objectModeSymbol]
        ? (this[bufferLengthSymbol] += 1)
        : (this[bufferLengthSymbol] += minipassBufferPushChunk.length),
        this[bufferSymbol].push(minipassBufferPushChunk);
    }
    [bufferShiftSymbol]() {
      return (
        this[objectModeSymbol]
          ? (this[bufferLengthSymbol] -= 1)
          : (this[bufferLengthSymbol] -= this[bufferSymbol][0].length),
        this[bufferSymbol].shift()
      );
    }
    [flushSymbol](minipassFlushSuppressDrain = false) {
      do;
      while (
        this[flushChunkSymbol](this[bufferShiftSymbol]()) &&
        this[bufferSymbol].length
      );
      !minipassFlushSuppressDrain &&
        !this[bufferSymbol].length &&
        !this[eofSymbol] &&
        this.emit("drain");
    }
    [flushChunkSymbol](minipassFlushChunk) {
      return this.emit("data", minipassFlushChunk), this[flowingSymbol];
    }
    pipe(minipassPipeDestination, minipassPipeOptions) {
      if (this[destroyedSymbol]) return minipassPipeDestination;
      this[discardedSymbol] = false;
      let minipassPipeAlreadyEnded = this[emittedEndSymbol];
      return (
        (minipassPipeOptions = minipassPipeOptions || {}),
        minipassPipeDestination === processShim.stdout ||
        minipassPipeDestination === processShim.stderr
          ? (minipassPipeOptions.end = false)
          : (minipassPipeOptions.end = minipassPipeOptions.end !== false),
        (minipassPipeOptions.proxyErrors = !!minipassPipeOptions.proxyErrors),
        minipassPipeAlreadyEnded
          ? minipassPipeOptions.end && minipassPipeDestination.end()
          : (this[pipesSymbol].push(
              minipassPipeOptions.proxyErrors
                ? new PipeProxyErrors(
                    this,
                    minipassPipeDestination,
                    minipassPipeOptions,
                  )
                : new Pipe(this, minipassPipeDestination, minipassPipeOptions),
            ),
            this[asyncSymbol]
              ? deferMicrotask(() => this[resumeSymbol]())
              : this[resumeSymbol]()),
        minipassPipeDestination
      );
    }
    unpipe(minipassUnpipeDestination) {
      let minipassPipeBinding = this[pipesSymbol].find(
        (minipassPipeCandidate) =>
          minipassPipeCandidate.dest === minipassUnpipeDestination,
      );
      minipassPipeBinding &&
        (this[pipesSymbol].length === 1
          ? (this[flowingSymbol] &&
              this[dataListenersSymbol] === 0 &&
              (this[flowingSymbol] = false),
            (this[pipesSymbol] = []))
          : this[pipesSymbol].splice(
              this[pipesSymbol].indexOf(minipassPipeBinding),
              1,
            ),
        minipassPipeBinding.unpipe());
    }
    addListener(minipassAddListenerEvent, minipassAddListenerHandler) {
      return this.on(minipassAddListenerEvent, minipassAddListenerHandler);
    }
    on(minipassListenerEvent, minipassListenerHandler) {
      let minipassListenerResult = super.on(
        minipassListenerEvent,
        minipassListenerHandler,
      );
      if (minipassListenerEvent === "data")
        (this[discardedSymbol] = false),
          this[dataListenersSymbol]++,
          !this[pipesSymbol].length &&
            !this[flowingSymbol] &&
            this[resumeSymbol]();
      else {
        if (
          minipassListenerEvent === "readable" &&
          this[bufferLengthSymbol] !== 0
        )
          super.emit("readable");
        else {
          if (isEndLikeEvent(minipassListenerEvent) && this[emittedEndSymbol])
            super.emit(minipassListenerEvent),
              this.removeAllListeners(minipassListenerEvent);
          else {
            if (minipassListenerEvent === "error" && this[emittedErrorSymbol]) {
              let minipassReplayErrorListener = minipassListenerHandler;
              this[asyncSymbol]
                ? deferMicrotask(() =>
                    minipassReplayErrorListener.call(
                      this,
                      this[emittedErrorSymbol],
                    ),
                  )
                : minipassReplayErrorListener.call(
                    this,
                    this[emittedErrorSymbol],
                  );
            }
          }
        }
      }
      return minipassListenerResult;
    }
    removeListener(minipassRemoveListenerEvent, minipassRemoveListenerHandler) {
      return this.off(
        minipassRemoveListenerEvent,
        minipassRemoveListenerHandler,
      );
    }
    off(minipassOffEvent, minipassOffHandler) {
      let minipassOffResult = super.off(minipassOffEvent, minipassOffHandler);
      return (
        minipassOffEvent === "data" &&
          ((this[dataListenersSymbol] = this.listeners("data").length),
          this[dataListenersSymbol] === 0 &&
            !this[discardedSymbol] &&
            !this[pipesSymbol].length &&
            (this[flowingSymbol] = false)),
        minipassOffResult
      );
    }
    removeAllListeners(minipassRemoveAllEvent) {
      let minipassRemoveAllResult = super.removeAllListeners(
        minipassRemoveAllEvent,
      );
      return (
        (minipassRemoveAllEvent === "data" ||
          minipassRemoveAllEvent === void 0) &&
          ((this[dataListenersSymbol] = 0),
          !this[discardedSymbol] &&
            !this[pipesSymbol].length &&
            (this[flowingSymbol] = false)),
        minipassRemoveAllResult
      );
    }
    get emittedEnd() {
      return this[emittedEndSymbol];
    }
    [maybeEmitEndSymbol]() {
      !this[emittingEndSymbol] &&
        !this[emittedEndSymbol] &&
        !this[destroyedSymbol] &&
        this[bufferSymbol].length === 0 &&
        this[eofSymbol] &&
        ((this[emittingEndSymbol] = true),
        this.emit("end"),
        this.emit("prefinish"),
        this.emit("finish"),
        this[closedSymbol] && this.emit("close"),
        (this[emittingEndSymbol] = false));
    }
    emit(minipassEmitEvent, ...minipassEmitArgs) {
      let minipassEmitFirstArg = minipassEmitArgs[0];
      if (
        minipassEmitEvent !== "error" &&
        minipassEmitEvent !== "close" &&
        minipassEmitEvent !== destroyedSymbol &&
        this[destroyedSymbol]
      )
        return false;
      if (minipassEmitEvent === "data")
        return !this[objectModeSymbol] && !minipassEmitFirstArg
          ? false
          : this[asyncSymbol]
            ? (deferMicrotask(() => this[emitDataSymbol](minipassEmitFirstArg)),
              true)
            : this[emitDataSymbol](minipassEmitFirstArg);
      if (minipassEmitEvent === "end") return this[emitEndSymbol]();
      if (minipassEmitEvent === "close") {
        if (
          ((this[closedSymbol] = true),
          !this[emittedEndSymbol] && !this[destroyedSymbol])
        )
          return false;
        let minipassCloseEmitResult = super.emit("close");
        return this.removeAllListeners("close"), minipassCloseEmitResult;
      } else {
        if (minipassEmitEvent === "error") {
          (this[emittedErrorSymbol] = minipassEmitFirstArg),
            super.emit(errorSymbol, minipassEmitFirstArg);
          let minipassErrorEmitResult =
            !this[signalSymbol] || this.listeners("error").length
              ? super.emit("error", minipassEmitFirstArg)
              : false;
          return this[maybeEmitEndSymbol](), minipassErrorEmitResult;
        } else {
          if (minipassEmitEvent === "resume") {
            let minipassResumeEmitResult = super.emit("resume");
            return this[maybeEmitEndSymbol](), minipassResumeEmitResult;
          } else {
            if (
              minipassEmitEvent === "finish" ||
              minipassEmitEvent === "prefinish"
            ) {
              let minipassFinishEmitResult = super.emit(minipassEmitEvent);
              return (
                this.removeAllListeners(minipassEmitEvent),
                minipassFinishEmitResult
              );
            }
          }
        }
      }
      let minipassGenericEmitResult = super.emit(
        minipassEmitEvent,
        ...minipassEmitArgs,
      );
      return this[maybeEmitEndSymbol](), minipassGenericEmitResult;
    }
    [emitDataSymbol](minipassEmitDataChunk) {
      for (let minipassDataPipeBinding of this[pipesSymbol])
        minipassDataPipeBinding.dest.write(minipassEmitDataChunk) === false &&
          this.pause();
      let minipassDataEmitResult = this[discardedSymbol]
        ? false
        : super.emit("data", minipassEmitDataChunk);
      return this[maybeEmitEndSymbol](), minipassDataEmitResult;
    }
    [emitEndSymbol]() {
      return this[emittedEndSymbol]
        ? false
        : ((this[emittedEndSymbol] = true),
          (this.readable = false),
          this[asyncSymbol]
            ? (deferMicrotask(() => this[emitEnd2Symbol]()), true)
            : this[emitEnd2Symbol]());
    }
    [emitEnd2Symbol]() {
      if (this[decoderSymbol]) {
        let minipassDecoderRemainder = this[decoderSymbol].end();
        if (minipassDecoderRemainder) {
          for (let minipassDecoderPipeBinding of this[pipesSymbol])
            minipassDecoderPipeBinding.dest.write(minipassDecoderRemainder);
          this[discardedSymbol] || super.emit("data", minipassDecoderRemainder);
        }
      }
      for (let minipassEndingPipeBinding of this[pipesSymbol])
        minipassEndingPipeBinding.end();
      let minipassEndEmitResult = super.emit("end");
      return this.removeAllListeners("end"), minipassEndEmitResult;
    }
    async collect() {
      let minipassCollectedChunks = Object.assign([], { dataLength: 0 });
      this[objectModeSymbol] || (minipassCollectedChunks.dataLength = 0);
      let minipassCollectPromise = this.promise();
      return (
        this.on("data", (minipassCollectedChunk) => {
          minipassCollectedChunks.push(minipassCollectedChunk),
            this[objectModeSymbol] ||
              (minipassCollectedChunks.dataLength +=
                minipassCollectedChunk.length);
        }),
        await minipassCollectPromise,
        minipassCollectedChunks
      );
    }
    async concat() {
      if (this[objectModeSymbol]) throw Error("cannot concat in objectMode");
      let minipassConcatChunks = await this.collect();
      return this[encodingSymbol]
        ? minipassConcatChunks.join("")
        : Buffer.concat(minipassConcatChunks, minipassConcatChunks.dataLength);
    }
    async promise() {
      return new Promise((minipassPromiseResolve, minipassPromiseReject) => {
        this.on(destroyedSymbol, () =>
          minipassPromiseReject(Error("stream destroyed")),
        ),
          this.on("error", (minipassPromiseError) =>
            minipassPromiseReject(minipassPromiseError),
          ),
          this.on("end", () => minipassPromiseResolve());
      });
    }
    [Symbol.asyncIterator]() {
      this[discardedSymbol] = false;
      let minipassIteratorDone = false,
        minipassFinishIterator = async () => (
          this.pause(),
          (minipassIteratorDone = true),
          { value: void 0, done: true }
        );
      return {
        next: () => {
          if (minipassIteratorDone) return minipassFinishIterator();
          let minipassIteratorReadChunk = this.read();
          if (minipassIteratorReadChunk !== null)
            return Promise.resolve({
              done: false,
              value: minipassIteratorReadChunk,
            });
          if (this[eofSymbol]) return minipassFinishIterator();
          let minipassIteratorResolve,
            minipassIteratorReject,
            minipassIteratorErrorHandler = (minipassIteratorError) => {
              this.off("data", minipassIteratorDataHandler),
                this.off("end", minipassIteratorEndHandler),
                this.off(destroyedSymbol, minipassIteratorDestroyedHandler),
                minipassFinishIterator(),
                minipassIteratorReject(minipassIteratorError);
            },
            minipassIteratorDataHandler = (minipassIteratorDataChunk) => {
              this.off("error", minipassIteratorErrorHandler),
                this.off("end", minipassIteratorEndHandler),
                this.off(destroyedSymbol, minipassIteratorDestroyedHandler),
                this.pause(),
                minipassIteratorResolve({
                  value: minipassIteratorDataChunk,
                  done: !!this[eofSymbol],
                });
            },
            minipassIteratorEndHandler = () => {
              this.off("error", minipassIteratorErrorHandler),
                this.off("data", minipassIteratorDataHandler),
                this.off(destroyedSymbol, minipassIteratorDestroyedHandler),
                minipassFinishIterator(),
                minipassIteratorResolve({ done: true, value: void 0 });
            },
            minipassIteratorDestroyedHandler = () =>
              minipassIteratorErrorHandler(Error("stream destroyed"));
          return new Promise(
            (minipassIteratorPromiseResolve, minipassIteratorPromiseReject) => {
              (minipassIteratorReject = minipassIteratorPromiseReject),
                (minipassIteratorResolve = minipassIteratorPromiseResolve),
                this.once(destroyedSymbol, minipassIteratorDestroyedHandler),
                this.once("error", minipassIteratorErrorHandler),
                this.once("end", minipassIteratorEndHandler),
                this.once("data", minipassIteratorDataHandler);
            },
          );
        },
        throw: minipassFinishIterator,
        return: minipassFinishIterator,
        [Symbol.asyncIterator]() {
          return this;
        },
        [Symbol.asyncDispose]: async () => {},
      };
    }
    [Symbol.iterator]() {
      this[discardedSymbol] = false;
      let minipassSyncIteratorDone = false,
        minipassFinishSyncIterator = () => (
          this.pause(),
          this.off(errorSymbol, minipassFinishSyncIterator),
          this.off(destroyedSymbol, minipassFinishSyncIterator),
          this.off("end", minipassFinishSyncIterator),
          (minipassSyncIteratorDone = true),
          { done: true, value: void 0 }
        ),
        minipassSyncIteratorNext = () => {
          if (minipassSyncIteratorDone) return minipassFinishSyncIterator();
          let minipassSyncIteratorChunk = this.read();
          return minipassSyncIteratorChunk === null
            ? minipassFinishSyncIterator()
            : { done: false, value: minipassSyncIteratorChunk };
        };
      return (
        this.once("end", minipassFinishSyncIterator),
        this.once(errorSymbol, minipassFinishSyncIterator),
        this.once(destroyedSymbol, minipassFinishSyncIterator),
        {
          next: minipassSyncIteratorNext,
          throw: minipassFinishSyncIterator,
          return: minipassFinishSyncIterator,
          [Symbol.iterator]() {
            return this;
          },
          [Symbol.dispose]: () => {},
        }
      );
    }
    destroy(minipassDestroyError) {
      if (this[destroyedSymbol])
        return (
          minipassDestroyError
            ? this.emit("error", minipassDestroyError)
            : this.emit(destroyedSymbol),
          this
        );
      (this[destroyedSymbol] = true),
        (this[discardedSymbol] = true),
        (this[bufferSymbol].length = 0),
        (this[bufferLengthSymbol] = 0);
      let minipassDestroyTarget = this;
      return (
        typeof minipassDestroyTarget.close == "function" &&
          !this[closedSymbol] &&
          minipassDestroyTarget.close(),
        minipassDestroyError
          ? this.emit("error", minipassDestroyError)
          : this.emit(destroyedSymbol),
        this
      );
    }
    static get isStream() {
      return isStream;
    }
  },
  fsWritev = streamFs.writev,
  autoCloseSymbol = Symbol("_autoClose"),
  closeSymbol = Symbol("_close"),
  endedSymbol = Symbol("_ended"),
  fdSymbol = Symbol("_fd"),
  finishedSymbol = Symbol("_finished"),
  flagsSymbol = Symbol("_flags"),
  fileStreamFlushSymbol = Symbol("_flush"),
  handleChunkSymbol = Symbol("_handleChunk"),
  makeBufSymbol = Symbol("_makeBuf"),
  modeSymbol = Symbol("_mode"),
  needDrainSymbol = Symbol("_needDrain"),
  onerrorSymbol = Symbol("_onerror"),
  onopenSymbol = Symbol("_onopen"),
  onreadSymbol = Symbol("_onread"),
  onwriteSymbol = Symbol("_onwrite"),
  openSymbol = Symbol("_open"),
  pathSymbol = Symbol("_path"),
  posSymbol = Symbol("_pos"),
  queueSymbol = Symbol("_queue"),
  fileStreamReadSymbol = Symbol("_read"),
  readSizeSymbol = Symbol("_readSize"),
  readingSymbol = Symbol("_reading"),
  remainSymbol = Symbol("_remain"),
  sizeSymbol = Symbol("_size"),
  writeSymbol = Symbol("_write"),
  writingSymbol = Symbol("_writing"),
  defaultFlagSymbol = Symbol("_defaultFlag"),
  erroredSymbol = Symbol("_errored"),
  ReadStream = class extends Minipass {
    [erroredSymbol] = false;
    [fdSymbol];
    [pathSymbol];
    [readSizeSymbol];
    [readingSymbol] = false;
    [sizeSymbol];
    [remainSymbol];
    [autoCloseSymbol];
    constructor(readStreamPath, readStreamOptions) {
      if (
        ((readStreamOptions = readStreamOptions || {}),
        super(readStreamOptions),
        (this.readable = true),
        (this.writable = false),
        typeof readStreamPath != "string")
      )
        throw TypeError("path must be a string");
      (this[erroredSymbol] = false),
        (this[fdSymbol] =
          typeof readStreamOptions.fd == "number"
            ? readStreamOptions.fd
            : void 0),
        (this[pathSymbol] = readStreamPath),
        (this[readSizeSymbol] = readStreamOptions.readSize || 16777216),
        (this[readingSymbol] = false),
        (this[sizeSymbol] =
          typeof readStreamOptions.size == "number"
            ? readStreamOptions.size
            : 1 / 0),
        (this[remainSymbol] = this[sizeSymbol]),
        (this[autoCloseSymbol] =
          typeof readStreamOptions.autoClose == "boolean"
            ? readStreamOptions.autoClose
            : true),
        typeof this[fdSymbol] == "number"
          ? this[fileStreamReadSymbol]()
          : this[openSymbol]();
    }
    get fd() {
      return this[fdSymbol];
    }
    get path() {
      return this[pathSymbol];
    }
    write() {
      throw TypeError("this is a readable stream");
    }
    end() {
      throw TypeError("this is a readable stream");
    }
    [openSymbol]() {
      streamFs.open(
        this[pathSymbol],
        "r",
        (readStreamOpenError, readStreamOpenedFd) =>
          this[onopenSymbol](readStreamOpenError, readStreamOpenedFd),
      );
    }
    [onopenSymbol](readStreamOnOpenError, readStreamOnOpenFd) {
      readStreamOnOpenError
        ? this[onerrorSymbol](readStreamOnOpenError)
        : ((this[fdSymbol] = readStreamOnOpenFd),
          this.emit("open", readStreamOnOpenFd),
          this[fileStreamReadSymbol]());
    }
    [makeBufSymbol]() {
      return Buffer.allocUnsafe(
        Math.min(this[readSizeSymbol], this[remainSymbol]),
      );
    }
    [fileStreamReadSymbol]() {
      if (!this[readingSymbol]) {
        this[readingSymbol] = true;
        let readStreamReadBuffer = this[makeBufSymbol]();
        if (readStreamReadBuffer.length === 0)
          return process.nextTick(() =>
            this[onreadSymbol](null, 0, readStreamReadBuffer),
          );
        streamFs.read(
          this[fdSymbol],
          readStreamReadBuffer,
          0,
          readStreamReadBuffer.length,
          null,
          (readStreamReadError, readStreamBytesRead, readStreamBuffer) =>
            this[onreadSymbol](
              readStreamReadError,
              readStreamBytesRead,
              readStreamBuffer,
            ),
        );
      }
    }
    [onreadSymbol](
      readStreamOnReadError,
      readStreamOnReadBytes,
      readStreamOnReadBuffer,
    ) {
      (this[readingSymbol] = false),
        readStreamOnReadError
          ? this[onerrorSymbol](readStreamOnReadError)
          : this[handleChunkSymbol](
              readStreamOnReadBytes,
              readStreamOnReadBuffer,
            ) && this[fileStreamReadSymbol]();
    }
    [closeSymbol]() {
      if (this[autoCloseSymbol] && typeof this[fdSymbol] == "number") {
        let readStreamCloseFd = this[fdSymbol];
        (this[fdSymbol] = void 0),
          streamFs.close(readStreamCloseFd, (readStreamCloseError) =>
            readStreamCloseError
              ? this.emit("error", readStreamCloseError)
              : this.emit("close"),
          );
      }
    }
    [onerrorSymbol](readStreamError) {
      (this[readingSymbol] = true),
        this[closeSymbol](),
        this.emit("error", readStreamError);
    }
    [handleChunkSymbol](readStreamChunkBytes, readStreamChunkBuffer) {
      let readStreamShouldContinue = false;
      return (
        (this[remainSymbol] -= readStreamChunkBytes),
        readStreamChunkBytes > 0 &&
          (readStreamShouldContinue = super.write(
            readStreamChunkBytes < readStreamChunkBuffer.length
              ? readStreamChunkBuffer.subarray(0, readStreamChunkBytes)
              : readStreamChunkBuffer,
          )),
        (readStreamChunkBytes === 0 || this[remainSymbol] <= 0) &&
          ((readStreamShouldContinue = false),
          this[closeSymbol](),
          super.end()),
        readStreamShouldContinue
      );
    }
    emit(readStreamEmitEvent, ...readStreamEmitArgs) {
      switch (readStreamEmitEvent) {
        case "prefinish":
        case "finish":
          return false;
        case "drain":
          return (
            typeof this[fdSymbol] == "number" && this[fileStreamReadSymbol](),
            false
          );
        case "error":
          return this[erroredSymbol]
            ? false
            : ((this[erroredSymbol] = true),
              super.emit(readStreamEmitEvent, ...readStreamEmitArgs));
        default:
          return super.emit(readStreamEmitEvent, ...readStreamEmitArgs);
      }
    }
  },
  ReadStreamSync = class extends ReadStream {
    [openSymbol]() {
      let readStreamSyncOpenFailed = true;
      try {
        this[onopenSymbol](null, streamFs.openSync(this[pathSymbol], "r")),
          (readStreamSyncOpenFailed = false);
      } finally {
        readStreamSyncOpenFailed && this[closeSymbol]();
      }
    }
    [fileStreamReadSymbol]() {
      let readStreamSyncReadFailed = true;
      try {
        if (!this[readingSymbol]) {
          this[readingSymbol] = true;
          do {
            let readStreamSyncBuffer = this[makeBufSymbol](),
              readStreamSyncBytesRead =
                readStreamSyncBuffer.length === 0
                  ? 0
                  : streamFs.readSync(
                      this[fdSymbol],
                      readStreamSyncBuffer,
                      0,
                      readStreamSyncBuffer.length,
                      null,
                    );
            if (
              !this[handleChunkSymbol](
                readStreamSyncBytesRead,
                readStreamSyncBuffer,
              )
            )
              break;
          } while (true);
          this[readingSymbol] = false;
        }
        readStreamSyncReadFailed = false;
      } finally {
        readStreamSyncReadFailed && this[closeSymbol]();
      }
    }
    [closeSymbol]() {
      if (this[autoCloseSymbol] && typeof this[fdSymbol] == "number") {
        let readStreamSyncCloseFd = this[fdSymbol];
        (this[fdSymbol] = void 0),
          streamFs.closeSync(readStreamSyncCloseFd),
          this.emit("close");
      }
    }
  },
  WriteStream = class extends eventsModule {
    readable = false;
    writable = true;
    [erroredSymbol] = false;
    [writingSymbol] = false;
    [endedSymbol] = false;
    [queueSymbol] = [];
    [needDrainSymbol] = false;
    [pathSymbol];
    [modeSymbol];
    [autoCloseSymbol];
    [fdSymbol];
    [defaultFlagSymbol];
    [flagsSymbol];
    [finishedSymbol] = false;
    [posSymbol];
    constructor(writeStreamPath, writeStreamOptions) {
      (writeStreamOptions = writeStreamOptions || {}),
        super(writeStreamOptions),
        (this[pathSymbol] = writeStreamPath),
        (this[fdSymbol] =
          typeof writeStreamOptions.fd == "number"
            ? writeStreamOptions.fd
            : void 0),
        (this[modeSymbol] =
          writeStreamOptions.mode === void 0 ? 438 : writeStreamOptions.mode),
        (this[posSymbol] =
          typeof writeStreamOptions.start == "number"
            ? writeStreamOptions.start
            : void 0),
        (this[autoCloseSymbol] =
          typeof writeStreamOptions.autoClose == "boolean"
            ? writeStreamOptions.autoClose
            : true);
      let writeStreamDefaultFlags = this[posSymbol] !== void 0 ? "r+" : "w";
      (this[defaultFlagSymbol] = writeStreamOptions.flags === void 0),
        (this[flagsSymbol] =
          writeStreamOptions.flags === void 0
            ? writeStreamDefaultFlags
            : writeStreamOptions.flags),
        this[fdSymbol] === void 0 && this[openSymbol]();
    }
    emit(writeStreamEmitEvent, ...writeStreamEmitArgs) {
      if (writeStreamEmitEvent === "error") {
        if (this[erroredSymbol]) return false;
        this[erroredSymbol] = true;
      }
      return super.emit(writeStreamEmitEvent, ...writeStreamEmitArgs);
    }
    get fd() {
      return this[fdSymbol];
    }
    get path() {
      return this[pathSymbol];
    }
    [onerrorSymbol](writeStreamError) {
      this[closeSymbol](),
        (this[writingSymbol] = true),
        this.emit("error", writeStreamError);
    }
    [openSymbol]() {
      streamFs.open(
        this[pathSymbol],
        this[flagsSymbol],
        this[modeSymbol],
        (writeStreamOpenError, writeStreamOpenedFd) =>
          this[onopenSymbol](writeStreamOpenError, writeStreamOpenedFd),
      );
    }
    [onopenSymbol](writeStreamOnOpenError, writeStreamOnOpenFd) {
      this[defaultFlagSymbol] &&
      this[flagsSymbol] === "r+" &&
      writeStreamOnOpenError &&
      writeStreamOnOpenError.code === "ENOENT"
        ? ((this[flagsSymbol] = "w"), this[openSymbol]())
        : writeStreamOnOpenError
          ? this[onerrorSymbol](writeStreamOnOpenError)
          : ((this[fdSymbol] = writeStreamOnOpenFd),
            this.emit("open", writeStreamOnOpenFd),
            this[writingSymbol] || this[fileStreamFlushSymbol]());
    }
    end(writeStreamEndChunk, writeStreamEndEncoding) {
      return (
        writeStreamEndChunk &&
          this.write(writeStreamEndChunk, writeStreamEndEncoding),
        (this[endedSymbol] = true),
        !this[writingSymbol] &&
          !this[queueSymbol].length &&
          typeof this[fdSymbol] == "number" &&
          this[onwriteSymbol](null, 0),
        this
      );
    }
    write(writeStreamChunk, writeStreamEncoding) {
      return (
        typeof writeStreamChunk == "string" &&
          (writeStreamChunk = Buffer.from(
            writeStreamChunk,
            writeStreamEncoding,
          )),
        this[endedSymbol]
          ? (this.emit("error", Error("write() after end()")), false)
          : this[fdSymbol] === void 0 ||
              this[writingSymbol] ||
              this[queueSymbol].length
            ? (this[queueSymbol].push(writeStreamChunk),
              (this[needDrainSymbol] = true),
              false)
            : ((this[writingSymbol] = true),
              this[writeSymbol](writeStreamChunk),
              true)
      );
    }
    [writeSymbol](writeStreamWriteBuffer) {
      streamFs.write(
        this[fdSymbol],
        writeStreamWriteBuffer,
        0,
        writeStreamWriteBuffer.length,
        this[posSymbol],
        (writeStreamWriteError, writeStreamBytesWritten) =>
          this[onwriteSymbol](writeStreamWriteError, writeStreamBytesWritten),
      );
    }
    [onwriteSymbol](writeStreamOnWriteError, writeStreamOnWriteBytes) {
      writeStreamOnWriteError
        ? this[onerrorSymbol](writeStreamOnWriteError)
        : (this[posSymbol] !== void 0 &&
            typeof writeStreamOnWriteBytes == "number" &&
            (this[posSymbol] += writeStreamOnWriteBytes),
          this[queueSymbol].length
            ? this[fileStreamFlushSymbol]()
            : ((this[writingSymbol] = false),
              this[endedSymbol] && !this[finishedSymbol]
                ? ((this[finishedSymbol] = true),
                  this[closeSymbol](),
                  this.emit("finish"))
                : this[needDrainSymbol] &&
                  ((this[needDrainSymbol] = false), this.emit("drain"))));
    }
    [fileStreamFlushSymbol]() {
      if (this[queueSymbol].length === 0)
        this[endedSymbol] && this[onwriteSymbol](null, 0);
      else {
        if (this[queueSymbol].length === 1)
          this[writeSymbol](this[queueSymbol].pop());
        else {
          let writeStreamWritevQueue = this[queueSymbol];
          (this[queueSymbol] = []),
            fsWritev(
              this[fdSymbol],
              writeStreamWritevQueue,
              this[posSymbol],
              (writeStreamWritevError, writeStreamWritevBytes) =>
                this[onwriteSymbol](
                  writeStreamWritevError,
                  writeStreamWritevBytes,
                ),
            );
        }
      }
    }
    [closeSymbol]() {
      if (this[autoCloseSymbol] && typeof this[fdSymbol] == "number") {
        let writeStreamCloseFd = this[fdSymbol];
        (this[fdSymbol] = void 0),
          streamFs.close(writeStreamCloseFd, (writeStreamCloseError) =>
            writeStreamCloseError
              ? this.emit("error", writeStreamCloseError)
              : this.emit("close"),
          );
      }
    }
  },
  WriteStreamSync = class extends WriteStream {
    [openSymbol]() {
      let writeStreamSyncOpenedFd;
      if (this[defaultFlagSymbol] && this[flagsSymbol] === "r+")
        try {
          writeStreamSyncOpenedFd = streamFs.openSync(
            this[pathSymbol],
            this[flagsSymbol],
            this[modeSymbol],
          );
        } catch (writeStreamSyncOpenError) {
          if (writeStreamSyncOpenError?.code === "ENOENT")
            return (this[flagsSymbol] = "w"), this[openSymbol]();
          throw writeStreamSyncOpenError;
        }
      else
        writeStreamSyncOpenedFd = streamFs.openSync(
          this[pathSymbol],
          this[flagsSymbol],
          this[modeSymbol],
        );
      this[onopenSymbol](null, writeStreamSyncOpenedFd);
    }
    [closeSymbol]() {
      if (this[autoCloseSymbol] && typeof this[fdSymbol] == "number") {
        let writeStreamSyncCloseFd = this[fdSymbol];
        (this[fdSymbol] = void 0),
          streamFs.closeSync(writeStreamSyncCloseFd),
          this.emit("close");
      }
    }
    [writeSymbol](writeStreamSyncWriteBuffer) {
      let writeStreamSyncWriteFailed = true;
      try {
        this[onwriteSymbol](
          null,
          streamFs.writeSync(
            this[fdSymbol],
            writeStreamSyncWriteBuffer,
            0,
            writeStreamSyncWriteBuffer.length,
            this[posSymbol],
          ),
        ),
          (writeStreamSyncWriteFailed = false);
      } finally {
        if (writeStreamSyncWriteFailed)
          try {
            this[closeSymbol]();
          } catch {}
      }
    }
  },
  tarOptionAliasMap = new Map([
    ["C", "cwd"],
    ["f", "file"],
    ["z", "gzip"],
    ["P", "preservePaths"],
    ["U", "unlink"],
    ["strip-components", "strip"],
    ["stripComponents", "strip"],
    ["keep-newer", "newer"],
    ["keepNewer", "newer"],
    ["keep-newer-files", "newer"],
    ["keepNewerFiles", "newer"],
    ["k", "keep"],
    ["keep-existing", "keep"],
    ["keepExisting", "keep"],
    ["m", "noMtime"],
    ["no-mtime", "noMtime"],
    ["p", "preserveOwner"],
    ["L", "follow"],
    ["h", "follow"],
    ["onentry", "onReadEntry"],
  ]),
  isSyncFileOption = (tarSyncFileOptions) =>
    !!tarSyncFileOptions.sync && !!tarSyncFileOptions.file,
  isAsyncFileOption = (tarAsyncFileOptions) =>
    !tarAsyncFileOptions.sync && !!tarAsyncFileOptions.file,
  isSyncNoFileOption = (tarSyncNoFileOptions) =>
    !!tarSyncNoFileOptions.sync && !tarSyncNoFileOptions.file,
  isAsyncNoFileOption = (tarAsyncNoFileOptions) =>
    !tarAsyncNoFileOptions.sync && !tarAsyncNoFileOptions.file,
  hasFileOption = (tarFileOptionCandidate) => !!tarFileOptionCandidate.file,
  normalizeTarOptionKey = (rawTarOptionKey) => {
    return tarOptionAliasMap.get(rawTarOptionKey) || rawTarOptionKey;
  },
  normalizeTarOptions = (rawTarOptions = {}) => {
    if (!rawTarOptions) return {};
    let normalizedTarOptions = {};
    for (let [tarOptionEntryKey, tarOptionEntryValue] of Object.entries(
      rawTarOptions,
    )) {
      let normalizedTarOptionKey = normalizeTarOptionKey(tarOptionEntryKey);
      normalizedTarOptions[normalizedTarOptionKey] = tarOptionEntryValue;
    }
    return (
      normalizedTarOptions.chmod === void 0 &&
        normalizedTarOptions.noChmod === false &&
        (normalizedTarOptions.chmod = true),
      delete normalizedTarOptions.noChmod,
      normalizedTarOptions
    );
  },
  createTarFacade = (
    tarSyncFileHandler,
    tarAsyncFileHandler,
    tarSyncNoFileHandler,
    tarAsyncNoFileHandler,
    tarFacadeValidate,
  ) =>
    Object.assign(
      (tarFacadeRawOptions = [], tarFacadePaths, tarFacadeCallback) => {
        Array.isArray(tarFacadeRawOptions) &&
          ((tarFacadePaths = tarFacadeRawOptions), (tarFacadeRawOptions = {})),
          typeof tarFacadePaths == "function" &&
            ((tarFacadeCallback = tarFacadePaths), (tarFacadePaths = void 0)),
          (tarFacadePaths = tarFacadePaths ? Array.from(tarFacadePaths) : []);
        let tarFacadeOptions = normalizeTarOptions(tarFacadeRawOptions);
        if (
          (tarFacadeValidate?.(tarFacadeOptions, tarFacadePaths),
          isSyncFileOption(tarFacadeOptions))
        ) {
          if (typeof tarFacadeCallback == "function")
            throw TypeError("callback not supported for sync tar functions");
          return tarSyncFileHandler(tarFacadeOptions, tarFacadePaths);
        } else {
          if (isAsyncFileOption(tarFacadeOptions)) {
            let tarFacadeAsyncResult = tarAsyncFileHandler(
              tarFacadeOptions,
              tarFacadePaths,
            );
            return tarFacadeCallback
              ? tarFacadeAsyncResult.then(
                  () => tarFacadeCallback(),
                  tarFacadeCallback,
                )
              : tarFacadeAsyncResult;
          } else {
            if (isSyncNoFileOption(tarFacadeOptions)) {
              if (typeof tarFacadeCallback == "function")
                throw TypeError(
                  "callback not supported for sync tar functions",
                );
              return tarSyncNoFileHandler(tarFacadeOptions, tarFacadePaths);
            } else {
              if (isAsyncNoFileOption(tarFacadeOptions)) {
                if (typeof tarFacadeCallback == "function")
                  throw TypeError("callback only supported with file option");
                return tarAsyncNoFileHandler(tarFacadeOptions, tarFacadePaths);
              }
            }
          }
        }
        throw Error("impossible options??");
      },
      {
        syncFile: tarSyncFileHandler,
        asyncFile: tarAsyncFileHandler,
        syncNoFile: tarSyncNoFileHandler,
        asyncNoFile: tarAsyncNoFileHandler,
        validate: tarFacadeValidate,
      },
    ),
  nativeZlibConstants = zlibConstantsModule.constants || { ZLIB_VERNUM: 4736 },
  zlibConstants = Object.freeze(
    Object.assign(
      Object.create(null),
      {
        Z_NO_FLUSH: 0,
        Z_PARTIAL_FLUSH: 1,
        Z_SYNC_FLUSH: 2,
        Z_FULL_FLUSH: 3,
        Z_FINISH: 4,
        Z_BLOCK: 5,
        Z_OK: 0,
        Z_STREAM_END: 1,
        Z_NEED_DICT: 2,
        Z_ERRNO: -1,
        Z_STREAM_ERROR: -2,
        Z_DATA_ERROR: -3,
        Z_MEM_ERROR: -4,
        Z_BUF_ERROR: -5,
        Z_VERSION_ERROR: -6,
        Z_NO_COMPRESSION: 0,
        Z_BEST_SPEED: 1,
        Z_BEST_COMPRESSION: 9,
        Z_DEFAULT_COMPRESSION: -1,
        Z_FILTERED: 1,
        Z_HUFFMAN_ONLY: 2,
        Z_RLE: 3,
        Z_FIXED: 4,
        Z_DEFAULT_STRATEGY: 0,
        DEFLATE: 1,
        INFLATE: 2,
        GZIP: 3,
        GUNZIP: 4,
        DEFLATERAW: 5,
        INFLATERAW: 6,
        UNZIP: 7,
        BROTLI_DECODE: 8,
        BROTLI_ENCODE: 9,
        Z_MIN_WINDOWBITS: 8,
        Z_MAX_WINDOWBITS: 15,
        Z_DEFAULT_WINDOWBITS: 15,
        Z_MIN_CHUNK: 64,
        Z_MAX_CHUNK: 1 / 0,
        Z_DEFAULT_CHUNK: 16384,
        Z_MIN_MEMLEVEL: 1,
        Z_MAX_MEMLEVEL: 9,
        Z_DEFAULT_MEMLEVEL: 8,
        Z_MIN_LEVEL: -1,
        Z_MAX_LEVEL: 9,
        Z_DEFAULT_LEVEL: -1,
        BROTLI_OPERATION_PROCESS: 0,
        BROTLI_OPERATION_FLUSH: 1,
        BROTLI_OPERATION_FINISH: 2,
        BROTLI_OPERATION_EMIT_METADATA: 3,
        BROTLI_MODE_GENERIC: 0,
        BROTLI_MODE_TEXT: 1,
        BROTLI_MODE_FONT: 2,
        BROTLI_DEFAULT_MODE: 0,
        BROTLI_MIN_QUALITY: 0,
        BROTLI_MAX_QUALITY: 11,
        BROTLI_DEFAULT_QUALITY: 11,
        BROTLI_MIN_WINDOW_BITS: 10,
        BROTLI_MAX_WINDOW_BITS: 24,
        BROTLI_LARGE_MAX_WINDOW_BITS: 30,
        BROTLI_DEFAULT_WINDOW: 22,
        BROTLI_MIN_INPUT_BLOCK_BITS: 16,
        BROTLI_MAX_INPUT_BLOCK_BITS: 24,
        BROTLI_PARAM_MODE: 0,
        BROTLI_PARAM_QUALITY: 1,
        BROTLI_PARAM_LGWIN: 2,
        BROTLI_PARAM_LGBLOCK: 3,
        BROTLI_PARAM_DISABLE_LITERAL_CONTEXT_MODELING: 4,
        BROTLI_PARAM_SIZE_HINT: 5,
        BROTLI_PARAM_LARGE_WINDOW: 6,
        BROTLI_PARAM_NPOSTFIX: 7,
        BROTLI_PARAM_NDIRECT: 8,
        BROTLI_DECODER_RESULT_ERROR: 0,
        BROTLI_DECODER_RESULT_SUCCESS: 1,
        BROTLI_DECODER_RESULT_NEEDS_MORE_INPUT: 2,
        BROTLI_DECODER_RESULT_NEEDS_MORE_OUTPUT: 3,
        BROTLI_DECODER_PARAM_DISABLE_RING_BUFFER_REALLOCATION: 0,
        BROTLI_DECODER_PARAM_LARGE_WINDOW: 1,
        BROTLI_DECODER_NO_ERROR: 0,
        BROTLI_DECODER_SUCCESS: 1,
        BROTLI_DECODER_NEEDS_MORE_INPUT: 2,
        BROTLI_DECODER_NEEDS_MORE_OUTPUT: 3,
        BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_NIBBLE: -1,
        BROTLI_DECODER_ERROR_FORMAT_RESERVED: -2,
        BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_META_NIBBLE: -3,
        BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_ALPHABET: -4,
        BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_SAME: -5,
        BROTLI_DECODER_ERROR_FORMAT_CL_SPACE: -6,
        BROTLI_DECODER_ERROR_FORMAT_HUFFMAN_SPACE: -7,
        BROTLI_DECODER_ERROR_FORMAT_CONTEXT_MAP_REPEAT: -8,
        BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_1: -9,
        BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_2: -10,
        BROTLI_DECODER_ERROR_FORMAT_TRANSFORM: -11,
        BROTLI_DECODER_ERROR_FORMAT_DICTIONARY: -12,
        BROTLI_DECODER_ERROR_FORMAT_WINDOW_BITS: -13,
        BROTLI_DECODER_ERROR_FORMAT_PADDING_1: -14,
        BROTLI_DECODER_ERROR_FORMAT_PADDING_2: -15,
        BROTLI_DECODER_ERROR_FORMAT_DISTANCE: -16,
        BROTLI_DECODER_ERROR_DICTIONARY_NOT_SET: -19,
        BROTLI_DECODER_ERROR_INVALID_ARGUMENTS: -20,
        BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MODES: -21,
        BROTLI_DECODER_ERROR_ALLOC_TREE_GROUPS: -22,
        BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MAP: -25,
        BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_1: -26,
        BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_2: -27,
        BROTLI_DECODER_ERROR_ALLOC_BLOCK_TYPE_TREES: -30,
        BROTLI_DECODER_ERROR_UNREACHABLE: -31,
      },
      nativeZlibConstants,
    ),
  ),
  originalBufferConcat = zlibBuffer.concat,
  bufferConcatDescriptor = Object.getOwnPropertyDescriptor(
    zlibBuffer,
    "concat",
  ),
  identityBufferConcat = (zlibConcatSingleBuffer) => zlibConcatSingleBuffer,
  setBufferConcatShim =
    bufferConcatDescriptor?.writable === true ||
    bufferConcatDescriptor?.set !== void 0
      ? (enableZlibConcatShim) => {
          zlibBuffer.concat = enableZlibConcatShim
            ? identityBufferConcat
            : originalBufferConcat;
        }
      : (ignoredZlibConcatShimFlag) => {},
  superWriteSymbol = Symbol("_superWrite"),
  ZlibError = class extends Error {
    code;
    errno;
    constructor(zlibErrorCause, zlibErrorConstructor) {
      super("zlib: " + zlibErrorCause.message, { cause: zlibErrorCause }),
        (this.code = zlibErrorCause.code),
        (this.errno = zlibErrorCause.errno),
        this.code || (this.code = "ZLIB_ERROR"),
        (this.message = "zlib: " + zlibErrorCause.message),
        Error.captureStackTrace(this, zlibErrorConstructor ?? this.constructor);
    }
    get name() {
      return "ZlibError";
    }
  },
  flushFlagSymbol = Symbol("flushFlag"),
  ZlibBase = class extends Minipass {
    #zlibSawError = false;
    #zlibEnded = false;
    #zlibFlushFlag;
    #zlibFinishFlushFlag;
    #zlibFullFlushFlag;
    #zlibHandle;
    #zlibEmitWrappedError;
    get sawError() {
      return this.#zlibSawError;
    }
    get handle() {
      return this.#zlibHandle;
    }
    get flushFlag() {
      return this.#zlibFlushFlag;
    }
    constructor(zlibOptions, zlibMethodName) {
      if (!zlibOptions || typeof zlibOptions != "object")
        throw TypeError("invalid options for ZlibBase constructor");
      if (
        (super(zlibOptions),
        (this.#zlibFlushFlag = zlibOptions.flush ?? 0),
        (this.#zlibFinishFlushFlag = zlibOptions.finishFlush ?? 0),
        (this.#zlibFullFlushFlag = zlibOptions.fullFlushFlag ?? 0),
        typeof zlibModule[zlibMethodName] != "function")
      )
        throw TypeError("Compression method not supported: " + zlibMethodName);
      try {
        this.#zlibHandle = new zlibModule[zlibMethodName](zlibOptions);
      } catch (zlibConstructorError) {
        throw new ZlibError(zlibConstructorError, this.constructor);
      }
      (this.#zlibEmitWrappedError = (zlibWrappedError) => {
        this.#zlibSawError ||
          ((this.#zlibSawError = true),
          this.close(),
          this.emit("error", zlibWrappedError));
      }),
        this.#zlibHandle?.on("error", (zlibBindingError) =>
          this.#zlibEmitWrappedError(new ZlibError(zlibBindingError)),
        ),
        this.once("end", () => this.close);
    }
    close() {
      this.#zlibHandle &&
        (this.#zlibHandle.close(),
        (this.#zlibHandle = void 0),
        this.emit("close"));
    }
    reset() {
      if (!this.#zlibSawError)
        return (
          zlibAssert(this.#zlibHandle, "zlib binding closed"),
          this.#zlibHandle.reset?.()
        );
    }
    flush(zlibFlushFlag) {
      this.ended ||
        (typeof zlibFlushFlag != "number" &&
          (zlibFlushFlag = this.#zlibFullFlushFlag),
        this.write(
          Object.assign(zlibBuffer.alloc(0), {
            [flushFlagSymbol]: zlibFlushFlag,
          }),
        ));
    }
    end(zlibEndChunk, zlibEndEncoding, zlibEndCallback) {
      return (
        typeof zlibEndChunk == "function" &&
          ((zlibEndCallback = zlibEndChunk),
          (zlibEndEncoding = void 0),
          (zlibEndChunk = void 0)),
        typeof zlibEndEncoding == "function" &&
          ((zlibEndCallback = zlibEndEncoding), (zlibEndEncoding = void 0)),
        zlibEndChunk &&
          (zlibEndEncoding
            ? this.write(zlibEndChunk, zlibEndEncoding)
            : this.write(zlibEndChunk)),
        this.flush(this.#zlibFinishFlushFlag),
        (this.#zlibEnded = true),
        super.end(zlibEndCallback)
      );
    }
    get ended() {
      return this.#zlibEnded;
    }
    [superWriteSymbol](zlibSuperWriteChunk) {
      return super.write(zlibSuperWriteChunk);
    }
    write(zlibWriteChunk, zlibWriteEncoding, zlibWriteCallback) {
      if (
        (typeof zlibWriteEncoding == "function" &&
          ((zlibWriteCallback = zlibWriteEncoding),
          (zlibWriteEncoding = "utf8")),
        typeof zlibWriteChunk == "string" &&
          (zlibWriteChunk = zlibBuffer.from(zlibWriteChunk, zlibWriteEncoding)),
        this.#zlibSawError)
      )
        return;
      zlibAssert(this.#zlibHandle, "zlib binding closed");
      let zlibNativeHandle = this.#zlibHandle._handle,
        zlibNativeClose = zlibNativeHandle.close;
      zlibNativeHandle.close = () => {};
      let zlibCloseMethod = this.#zlibHandle.close;
      (this.#zlibHandle.close = () => {}), setBufferConcatShim(true);
      let zlibProcessedChunk;
      try {
        let zlibChunkFlushFlag =
          typeof zlibWriteChunk[flushFlagSymbol] == "number"
            ? zlibWriteChunk[flushFlagSymbol]
            : this.#zlibFlushFlag;
        (zlibProcessedChunk = this.#zlibHandle._processChunk(
          zlibWriteChunk,
          zlibChunkFlushFlag,
        )),
          setBufferConcatShim(false);
      } catch (zlibProcessChunkError) {
        setBufferConcatShim(false),
          this.#zlibEmitWrappedError(
            new ZlibError(zlibProcessChunkError, this.write),
          );
      } finally {
        this.#zlibHandle &&
          ((this.#zlibHandle._handle = zlibNativeHandle),
          (zlibNativeHandle.close = zlibNativeClose),
          (this.#zlibHandle.close = zlibCloseMethod),
          this.#zlibHandle.removeAllListeners("error"));
      }
      this.#zlibHandle &&
        this.#zlibHandle.on("error", (zlibPostProcessError) =>
          this.#zlibEmitWrappedError(
            new ZlibError(zlibPostProcessError, this.write),
          ),
        );
      let zlibWriteResult;
      if (zlibProcessedChunk) {
        if (
          Array.isArray(zlibProcessedChunk) &&
          zlibProcessedChunk.length > 0
        ) {
          let zlibFirstProcessedChunk = zlibProcessedChunk[0];
          zlibWriteResult = this[superWriteSymbol](
            zlibBuffer.from(zlibFirstProcessedChunk),
          );
          for (
            let zlibProcessedChunkIndex = 1;
            zlibProcessedChunkIndex < zlibProcessedChunk.length;
            zlibProcessedChunkIndex++
          )
            zlibWriteResult = this[superWriteSymbol](
              zlibProcessedChunk[zlibProcessedChunkIndex],
            );
        } else
          zlibWriteResult = this[superWriteSymbol](
            zlibBuffer.from(zlibProcessedChunk),
          );
      }
      return zlibWriteCallback && zlibWriteCallback(), zlibWriteResult;
    }
  },
  ZlibStream = class extends ZlibBase {
    #zlibParamsLevel;
    #zlibParamsStrategy;
    constructor(zlibStreamOptions, zlibStreamMethodName) {
      (zlibStreamOptions = zlibStreamOptions || {}),
        (zlibStreamOptions.flush =
          zlibStreamOptions.flush || zlibConstants.Z_NO_FLUSH),
        (zlibStreamOptions.finishFlush =
          zlibStreamOptions.finishFlush || zlibConstants.Z_FINISH),
        (zlibStreamOptions.fullFlushFlag = zlibConstants.Z_FULL_FLUSH),
        super(zlibStreamOptions, zlibStreamMethodName),
        (this.#zlibParamsLevel = zlibStreamOptions.level),
        (this.#zlibParamsStrategy = zlibStreamOptions.strategy);
    }
    params(zlibParamsLevel, zlibParamsStrategy) {
      if (!this.sawError) {
        if (!this.handle)
          throw Error("cannot switch params when binding is closed");
        if (!this.handle.params)
          throw Error("not supported in this implementation");
        if (
          this.#zlibParamsLevel !== zlibParamsLevel ||
          this.#zlibParamsStrategy !== zlibParamsStrategy
        ) {
          this.flush(zlibConstants.Z_SYNC_FLUSH),
            zlibAssert(this.handle, "zlib binding closed");
          let zlibOriginalFlush = this.handle.flush;
          this.handle.flush = (
            zlibParamsFlushFlag,
            zlibParamsFlushCallback,
          ) => {
            typeof zlibParamsFlushFlag == "function" &&
              ((zlibParamsFlushCallback = zlibParamsFlushFlag),
              (zlibParamsFlushFlag = this.flushFlag)),
              this.flush(zlibParamsFlushFlag),
              zlibParamsFlushCallback?.();
          };
          try {
            this.handle.params(zlibParamsLevel, zlibParamsStrategy);
          } finally {
            this.handle.flush = zlibOriginalFlush;
          }
          this.handle &&
            ((this.#zlibParamsLevel = zlibParamsLevel),
            (this.#zlibParamsStrategy = zlibParamsStrategy));
        }
      }
    }
  },
  Gzip = class extends ZlibStream {
    #gzipPortableHeader;
    constructor(gzipOptions) {
      super(gzipOptions, "Gzip"),
        (this.#gzipPortableHeader = gzipOptions && !!gzipOptions.portable);
    }
    [superWriteSymbol](gzipHeaderChunk) {
      return this.#gzipPortableHeader
        ? ((this.#gzipPortableHeader = false),
          (gzipHeaderChunk[9] = 255),
          super[superWriteSymbol](gzipHeaderChunk))
        : super[superWriteSymbol](gzipHeaderChunk);
    }
  },
  Unzip = class extends ZlibStream {
    constructor(unzipOptions) {
      super(unzipOptions, "Unzip");
    }
  },
  BrotliBase = class extends ZlibBase {
    constructor(brotliOptions, brotliMethodName) {
      (brotliOptions = brotliOptions || {}),
        (brotliOptions.flush =
          brotliOptions.flush || zlibConstants.BROTLI_OPERATION_PROCESS),
        (brotliOptions.finishFlush =
          brotliOptions.finishFlush || zlibConstants.BROTLI_OPERATION_FINISH),
        (brotliOptions.fullFlushFlag = zlibConstants.BROTLI_OPERATION_FLUSH),
        super(brotliOptions, brotliMethodName);
    }
  },
  BrotliCompress = class extends BrotliBase {
    constructor(brotliCompressOptions) {
      super(brotliCompressOptions, "BrotliCompress");
    }
  },
  BrotliDecompress = class extends BrotliBase {
    constructor(brotliDecompressOptions) {
      super(brotliDecompressOptions, "BrotliDecompress");
    }
  },
  ZstdBase = class extends ZlibBase {
    constructor(zstdOptions, zstdMethodName) {
      (zstdOptions = zstdOptions || {}),
        (zstdOptions.flush =
          zstdOptions.flush || zlibConstants.ZSTD_e_continue),
        (zstdOptions.finishFlush =
          zstdOptions.finishFlush || zlibConstants.ZSTD_e_end),
        (zstdOptions.fullFlushFlag = zlibConstants.ZSTD_e_flush),
        super(zstdOptions, zstdMethodName);
    }
  },
  ZstdCompress = class extends ZstdBase {
    constructor(zstdCompressOptions) {
      super(zstdCompressOptions, "ZstdCompress");
    }
  },
  ZstdDecompress = class extends ZstdBase {
    constructor(zstdDecompressOptions) {
      super(zstdDecompressOptions, "ZstdDecompress");
    }
  },
  encodeTarBase256Number = (tarBase256EncodeValue, tarBase256EncodeBuffer) => {
    if (Number.isSafeInteger(tarBase256EncodeValue))
      tarBase256EncodeValue < 0
        ? encodeTarBase256Negative(
            tarBase256EncodeValue,
            tarBase256EncodeBuffer,
          )
        : encodeTarBase256Positive(
            tarBase256EncodeValue,
            tarBase256EncodeBuffer,
          );
    else
      throw Error(
        "cannot encode number outside of javascript safe integer range",
      );
    return tarBase256EncodeBuffer;
  },
  encodeTarBase256Positive = (
    tarBase256PositiveValue,
    tarBase256PositiveBuffer,
  ) => {
    tarBase256PositiveBuffer[0] = 128;
    for (
      var tarBase256PositiveIndex = tarBase256PositiveBuffer.length;
      tarBase256PositiveIndex > 1;
      tarBase256PositiveIndex--
    )
      (tarBase256PositiveBuffer[tarBase256PositiveIndex - 1] =
        tarBase256PositiveValue & 255),
        (tarBase256PositiveValue = Math.floor(tarBase256PositiveValue / 256));
  },
  encodeTarBase256Negative = (
    tarBase256NegativeValue,
    tarBase256NegativeBuffer,
  ) => {
    tarBase256NegativeBuffer[0] = 255;
    var tarBase256SawNonZeroByte = false;
    tarBase256NegativeValue = tarBase256NegativeValue * -1;
    for (
      var tarBase256NegativeIndex = tarBase256NegativeBuffer.length;
      tarBase256NegativeIndex > 1;
      tarBase256NegativeIndex--
    ) {
      var tarBase256NegativeByte = tarBase256NegativeValue & 255;
      (tarBase256NegativeValue = Math.floor(tarBase256NegativeValue / 256)),
        tarBase256SawNonZeroByte
          ? (tarBase256NegativeBuffer[tarBase256NegativeIndex - 1] =
              onesComplementByte(tarBase256NegativeByte))
          : tarBase256NegativeByte === 0
            ? (tarBase256NegativeBuffer[tarBase256NegativeIndex - 1] = 0)
            : ((tarBase256SawNonZeroByte = true),
              (tarBase256NegativeBuffer[tarBase256NegativeIndex - 1] =
                twosComplementByte(tarBase256NegativeByte)));
    }
  },
  decodeTarBase256Number = (tarBase256DecodeBuffer) => {
    let tarBase256SignByte = tarBase256DecodeBuffer[0],
      decodedTarBase256Value =
        tarBase256SignByte === 128
          ? decodeTarBase256Positive(
              tarBase256DecodeBuffer.subarray(1, tarBase256DecodeBuffer.length),
            )
          : tarBase256SignByte === 255
            ? decodeTarBase256Negative(tarBase256DecodeBuffer)
            : null;
    if (decodedTarBase256Value === null)
      throw Error("invalid base256 encoding");
    if (!Number.isSafeInteger(decodedTarBase256Value))
      throw Error("parsed number outside of javascript safe integer range");
    return decodedTarBase256Value;
  },
  decodeTarBase256Negative = (tarBase256NegativeDecodeBuffer) => {
    for (
      var tarBase256NegativeLength = tarBase256NegativeDecodeBuffer.length,
        decodedNegativeTarBase256Value = 0,
        tarBase256DecodeSawNonZeroByte = false,
        tarBase256NegativeDecodeIndex = tarBase256NegativeLength - 1;
      tarBase256NegativeDecodeIndex > -1;
      tarBase256NegativeDecodeIndex--
    ) {
      var tarBase256EncodedByte = Number(
          tarBase256NegativeDecodeBuffer[tarBase256NegativeDecodeIndex],
        ),
        tarBase256DecodedByte;
      tarBase256DecodeSawNonZeroByte
        ? (tarBase256DecodedByte = onesComplementByte(tarBase256EncodedByte))
        : tarBase256EncodedByte === 0
          ? (tarBase256DecodedByte = tarBase256EncodedByte)
          : ((tarBase256DecodeSawNonZeroByte = true),
            (tarBase256DecodedByte = twosComplementByte(
              tarBase256EncodedByte,
            ))),
        tarBase256DecodedByte !== 0 &&
          (decodedNegativeTarBase256Value -=
            tarBase256DecodedByte *
            Math.pow(
              256,
              tarBase256NegativeLength - tarBase256NegativeDecodeIndex - 1,
            ));
    }
    return decodedNegativeTarBase256Value;
  },
  decodeTarBase256Positive = (tarBase256PositiveDecodeBuffer) => {
    for (
      var tarBase256PositiveLength = tarBase256PositiveDecodeBuffer.length,
        decodedPositiveTarBase256Value = 0,
        tarBase256PositiveDecodeIndex = tarBase256PositiveLength - 1;
      tarBase256PositiveDecodeIndex > -1;
      tarBase256PositiveDecodeIndex--
    ) {
      var tarBase256PositiveByte = Number(
        tarBase256PositiveDecodeBuffer[tarBase256PositiveDecodeIndex],
      );
      tarBase256PositiveByte !== 0 &&
        (decodedPositiveTarBase256Value +=
          tarBase256PositiveByte *
          Math.pow(
            256,
            tarBase256PositiveLength - tarBase256PositiveDecodeIndex - 1,
          ));
    }
    return decodedPositiveTarBase256Value;
  },
  onesComplementByte = (onesComplementInputByte) =>
    (255 ^ onesComplementInputByte) & 255,
  twosComplementByte = (twosComplementInputByte) =>
    ((255 ^ twosComplementInputByte) + 1) & 255,
  tarTypeExports = {};
defineTarExports(tarTypeExports, {
  code: () => tarTypeCodeByName,
  isCode: () => isTarTypeCode,
  isName: () => isTarTypeName,
  name: () => tarTypeNameByCode,
});
var isTarTypeCode = (tarTypeCodeCandidate) =>
    tarTypeNameByCode.has(tarTypeCodeCandidate),
  isTarTypeName = (tarTypeNameCandidate) =>
    tarTypeCodeByName.has(tarTypeNameCandidate),
  tarTypeNameByCode = new Map([
    ["0", "File"],
    ["", "OldFile"],
    ["1", "Link"],
    ["2", "SymbolicLink"],
    ["3", "CharacterDevice"],
    ["4", "BlockDevice"],
    ["5", "Directory"],
    ["6", "FIFO"],
    ["7", "ContiguousFile"],
    ["g", "GlobalExtendedHeader"],
    ["x", "ExtendedHeader"],
    ["A", "SolarisACL"],
    ["D", "GNUDumpDir"],
    ["I", "Inode"],
    ["K", "NextFileHasLongLinkpath"],
    ["L", "NextFileHasLongPath"],
    ["M", "ContinuationFile"],
    ["N", "OldGnuLongPath"],
    ["S", "SparseFile"],
    ["V", "TapeVolumeHeader"],
    ["X", "OldExtendedHeader"],
  ]),
  tarTypeCodeByName = new Map(
    Array.from(tarTypeNameByCode).map((tarTypeMapEntry) => [
      tarTypeMapEntry[1],
      tarTypeMapEntry[0],
    ]),
  ),
  TarHeader = class {
    cksumValid = false;
    needPax = false;
    nullBlock = false;
    block;
    path;
    mode;
    uid;
    gid;
    size;
    cksum;
    #tarHeaderTypeKey = "Unsupported";
    linkpath;
    uname;
    gname;
    devmaj = 0;
    devmin = 0;
    atime;
    ctime;
    mtime;
    charset;
    comment;
    constructor(
      tarHeaderInput,
      tarHeaderConstructorOffset = 0,
      tarHeaderConstructorLocalPax,
      tarHeaderConstructorGlobalPax,
    ) {
      Buffer.isBuffer(tarHeaderInput)
        ? this.decode(
            tarHeaderInput,
            tarHeaderConstructorOffset || 0,
            tarHeaderConstructorLocalPax,
            tarHeaderConstructorGlobalPax,
          )
        : tarHeaderInput && this.#applyTarHeaderFields(tarHeaderInput);
    }
    decode(
      tarHeaderBuffer,
      tarHeaderOffset,
      tarHeaderLocalPax,
      tarHeaderGlobalPax,
    ) {
      if (
        (tarHeaderOffset || (tarHeaderOffset = 0),
        !tarHeaderBuffer || !(tarHeaderBuffer.length >= tarHeaderOffset + 512))
      )
        throw Error("need 512 bytes for header");
      (this.path =
        tarHeaderLocalPax?.path ??
        decodeTarString(tarHeaderBuffer, tarHeaderOffset, 100)),
        (this.mode =
          tarHeaderLocalPax?.mode ??
          tarHeaderGlobalPax?.mode ??
          decodeTarNumber(tarHeaderBuffer, tarHeaderOffset + 100, 8)),
        (this.uid =
          tarHeaderLocalPax?.uid ??
          tarHeaderGlobalPax?.uid ??
          decodeTarNumber(tarHeaderBuffer, tarHeaderOffset + 108, 8)),
        (this.gid =
          tarHeaderLocalPax?.gid ??
          tarHeaderGlobalPax?.gid ??
          decodeTarNumber(tarHeaderBuffer, tarHeaderOffset + 116, 8)),
        (this.size =
          tarHeaderLocalPax?.size ??
          tarHeaderGlobalPax?.size ??
          decodeTarNumber(tarHeaderBuffer, tarHeaderOffset + 124, 12)),
        (this.mtime =
          tarHeaderLocalPax?.mtime ??
          tarHeaderGlobalPax?.mtime ??
          readTarDate(tarHeaderBuffer, tarHeaderOffset + 136, 12)),
        (this.cksum = decodeTarNumber(
          tarHeaderBuffer,
          tarHeaderOffset + 148,
          12,
        )),
        tarHeaderGlobalPax &&
          this.#applyTarHeaderFields(tarHeaderGlobalPax, true),
        tarHeaderLocalPax && this.#applyTarHeaderFields(tarHeaderLocalPax);
      let tarHeaderTypeKey = decodeTarString(
        tarHeaderBuffer,
        tarHeaderOffset + 156,
        1,
      );
      if (
        (isTarTypeCode(tarHeaderTypeKey) &&
          (this.#tarHeaderTypeKey = tarHeaderTypeKey || "0"),
        this.#tarHeaderTypeKey === "0" &&
          this.path.slice(-1) === "/" &&
          (this.#tarHeaderTypeKey = "5"),
        this.#tarHeaderTypeKey === "5" && (this.size = 0),
        (this.linkpath = decodeTarString(
          tarHeaderBuffer,
          tarHeaderOffset + 157,
          100,
        )),
        tarHeaderBuffer
          .subarray(tarHeaderOffset + 257, tarHeaderOffset + 265)
          .toString() === "ustar\u000000")
      ) {
        if (
          ((this.uname =
            tarHeaderLocalPax?.uname ??
            tarHeaderGlobalPax?.uname ??
            decodeTarString(tarHeaderBuffer, tarHeaderOffset + 265, 32)),
          (this.gname =
            tarHeaderLocalPax?.gname ??
            tarHeaderGlobalPax?.gname ??
            decodeTarString(tarHeaderBuffer, tarHeaderOffset + 297, 32)),
          (this.devmaj =
            tarHeaderLocalPax?.devmaj ??
            tarHeaderGlobalPax?.devmaj ??
            decodeTarNumber(tarHeaderBuffer, tarHeaderOffset + 329, 8) ??
            0),
          (this.devmin =
            tarHeaderLocalPax?.devmin ??
            tarHeaderGlobalPax?.devmin ??
            decodeTarNumber(tarHeaderBuffer, tarHeaderOffset + 337, 8) ??
            0),
          tarHeaderBuffer[tarHeaderOffset + 475] !== 0)
        ) {
          let tarHeaderLongPrefix = decodeTarString(
            tarHeaderBuffer,
            tarHeaderOffset + 345,
            155,
          );
          this.path = tarHeaderLongPrefix + "/" + this.path;
        } else {
          let tarHeaderPrefix = decodeTarString(
            tarHeaderBuffer,
            tarHeaderOffset + 345,
            130,
          );
          tarHeaderPrefix && (this.path = tarHeaderPrefix + "/" + this.path),
            (this.atime =
              tarHeaderLocalPax?.atime ??
              tarHeaderGlobalPax?.atime ??
              readTarDate(tarHeaderBuffer, tarHeaderOffset + 476, 12)),
            (this.ctime =
              tarHeaderLocalPax?.ctime ??
              tarHeaderGlobalPax?.ctime ??
              readTarDate(tarHeaderBuffer, tarHeaderOffset + 488, 12));
        }
      }
      let computedTarChecksum = 256;
      for (
        let tarChecksumFirstOffset = tarHeaderOffset;
        tarChecksumFirstOffset < tarHeaderOffset + 148;
        tarChecksumFirstOffset++
      )
        computedTarChecksum += tarHeaderBuffer[tarChecksumFirstOffset];
      for (
        let tarChecksumSecondOffset = tarHeaderOffset + 156;
        tarChecksumSecondOffset < tarHeaderOffset + 512;
        tarChecksumSecondOffset++
      )
        computedTarChecksum += tarHeaderBuffer[tarChecksumSecondOffset];
      (this.cksumValid = computedTarChecksum === this.cksum),
        this.cksum === void 0 &&
          computedTarChecksum === 256 &&
          (this.nullBlock = true);
    }
    #applyTarHeaderFields(tarHeaderFieldSource, skipTarPathFields = false) {
      Object.assign(
        this,
        Object.fromEntries(
          Object.entries(tarHeaderFieldSource).filter(
            ([tarHeaderFieldKey, tarHeaderFieldValue]) =>
              !(
                tarHeaderFieldValue == null ||
                (tarHeaderFieldKey === "path" && skipTarPathFields) ||
                (tarHeaderFieldKey === "linkpath" && skipTarPathFields) ||
                tarHeaderFieldKey === "global"
              ),
          ),
        ),
      );
    }
    encode(tarEncodeBuffer, tarEncodeOffset = 0) {
      if (
        (tarEncodeBuffer || (tarEncodeBuffer = this.block = Buffer.alloc(512)),
        this.#tarHeaderTypeKey === "Unsupported" &&
          (this.#tarHeaderTypeKey = "0"),
        !(tarEncodeBuffer.length >= tarEncodeOffset + 512))
      )
        throw Error("need 512 bytes for header");
      let tarPrefixFieldLength = this.ctime || this.atime ? 130 : 155,
        tarPathSplitParts = splitTarPath(this.path || "", tarPrefixFieldLength),
        tarPathNameField = tarPathSplitParts[0],
        tarPathPrefixField = tarPathSplitParts[1];
      (this.needPax = !!tarPathSplitParts[2]),
        (this.needPax =
          writeTarString(
            tarEncodeBuffer,
            tarEncodeOffset,
            100,
            tarPathNameField,
          ) || this.needPax),
        (this.needPax =
          encodeTarNumber(
            tarEncodeBuffer,
            tarEncodeOffset + 100,
            8,
            this.mode,
          ) || this.needPax),
        (this.needPax =
          encodeTarNumber(
            tarEncodeBuffer,
            tarEncodeOffset + 108,
            8,
            this.uid,
          ) || this.needPax),
        (this.needPax =
          encodeTarNumber(
            tarEncodeBuffer,
            tarEncodeOffset + 116,
            8,
            this.gid,
          ) || this.needPax),
        (this.needPax =
          encodeTarNumber(
            tarEncodeBuffer,
            tarEncodeOffset + 124,
            12,
            this.size,
          ) || this.needPax),
        (this.needPax =
          writeTarDate(
            tarEncodeBuffer,
            tarEncodeOffset + 136,
            12,
            this.mtime,
          ) || this.needPax),
        (tarEncodeBuffer[tarEncodeOffset + 156] = Number(
          this.#tarHeaderTypeKey.codePointAt(0),
        )),
        (this.needPax =
          writeTarString(
            tarEncodeBuffer,
            tarEncodeOffset + 157,
            100,
            this.linkpath,
          ) || this.needPax),
        tarEncodeBuffer.write("ustar\u000000", tarEncodeOffset + 257, 8),
        (this.needPax =
          writeTarString(
            tarEncodeBuffer,
            tarEncodeOffset + 265,
            32,
            this.uname,
          ) || this.needPax),
        (this.needPax =
          writeTarString(
            tarEncodeBuffer,
            tarEncodeOffset + 297,
            32,
            this.gname,
          ) || this.needPax),
        (this.needPax =
          encodeTarNumber(
            tarEncodeBuffer,
            tarEncodeOffset + 329,
            8,
            this.devmaj,
          ) || this.needPax),
        (this.needPax =
          encodeTarNumber(
            tarEncodeBuffer,
            tarEncodeOffset + 337,
            8,
            this.devmin,
          ) || this.needPax),
        (this.needPax =
          writeTarString(
            tarEncodeBuffer,
            tarEncodeOffset + 345,
            tarPrefixFieldLength,
            tarPathPrefixField,
          ) || this.needPax),
        tarEncodeBuffer[tarEncodeOffset + 475] !== 0
          ? (this.needPax =
              writeTarString(
                tarEncodeBuffer,
                tarEncodeOffset + 345,
                155,
                tarPathPrefixField,
              ) || this.needPax)
          : ((this.needPax =
              writeTarString(
                tarEncodeBuffer,
                tarEncodeOffset + 345,
                130,
                tarPathPrefixField,
              ) || this.needPax),
            (this.needPax =
              writeTarDate(
                tarEncodeBuffer,
                tarEncodeOffset + 476,
                12,
                this.atime,
              ) || this.needPax),
            (this.needPax =
              writeTarDate(
                tarEncodeBuffer,
                tarEncodeOffset + 488,
                12,
                this.ctime,
              ) || this.needPax));
      let encodedTarChecksum = 256;
      for (
        let encodedTarChecksumFirstOffset = tarEncodeOffset;
        encodedTarChecksumFirstOffset < tarEncodeOffset + 148;
        encodedTarChecksumFirstOffset++
      )
        encodedTarChecksum += tarEncodeBuffer[encodedTarChecksumFirstOffset];
      for (
        let encodedTarChecksumSecondOffset = tarEncodeOffset + 156;
        encodedTarChecksumSecondOffset < tarEncodeOffset + 512;
        encodedTarChecksumSecondOffset++
      )
        encodedTarChecksum += tarEncodeBuffer[encodedTarChecksumSecondOffset];
      return (
        (this.cksum = encodedTarChecksum),
        encodeTarNumber(tarEncodeBuffer, tarEncodeOffset + 148, 8, this.cksum),
        (this.cksumValid = true),
        this.needPax
      );
    }
    get type() {
      return this.#tarHeaderTypeKey === "Unsupported"
        ? this.#tarHeaderTypeKey
        : tarTypeNameByCode.get(this.#tarHeaderTypeKey);
    }
    get typeKey() {
      return this.#tarHeaderTypeKey;
    }
    set type(tarHeaderTypeName) {
      let tarHeaderEncodedTypeKey = String(
        tarTypeCodeByName.get(tarHeaderTypeName),
      );
      if (
        isTarTypeCode(tarHeaderEncodedTypeKey) ||
        tarHeaderEncodedTypeKey === "Unsupported"
      )
        this.#tarHeaderTypeKey = tarHeaderEncodedTypeKey;
      else {
        if (isTarTypeCode(tarHeaderTypeName))
          this.#tarHeaderTypeKey = tarHeaderTypeName;
        else throw TypeError("invalid entry type: " + tarHeaderTypeName);
      }
    }
  },
  splitTarPath = (tarPathToSplit, tarPrefixMaxBytes) => {
    let tarSplitNamePart = tarPathToSplit,
      tarSplitPrefixPart = "",
      tarSplitResult,
      tarSplitRoot = posixPath.parse(tarPathToSplit).root || ".";
    if (Buffer.byteLength(tarSplitNamePart) < 100)
      tarSplitResult = [tarSplitNamePart, tarSplitPrefixPart, false];
    else {
      (tarSplitPrefixPart = posixPath.dirname(tarSplitNamePart)),
        (tarSplitNamePart = posixPath.basename(tarSplitNamePart));
      do
        Buffer.byteLength(tarSplitNamePart) <= 100 &&
        Buffer.byteLength(tarSplitPrefixPart) <= tarPrefixMaxBytes
          ? (tarSplitResult = [tarSplitNamePart, tarSplitPrefixPart, false])
          : Buffer.byteLength(tarSplitNamePart) > 100 &&
              Buffer.byteLength(tarSplitPrefixPart) <= tarPrefixMaxBytes
            ? (tarSplitResult = [
                tarSplitNamePart.slice(0, 99),
                tarSplitPrefixPart,
                true,
              ])
            : ((tarSplitNamePart = posixPath.join(
                posixPath.basename(tarSplitPrefixPart),
                tarSplitNamePart,
              )),
              (tarSplitPrefixPart = posixPath.dirname(tarSplitPrefixPart)));
      while (tarSplitPrefixPart !== tarSplitRoot && tarSplitResult === void 0);
      tarSplitResult ||
        (tarSplitResult = [tarPathToSplit.slice(0, 99), "", true]);
    }
    return tarSplitResult;
  },
  decodeTarString = (
    decodeTarStringBuffer,
    decodeTarStringOffset,
    decodeTarStringLength,
  ) =>
    decodeTarStringBuffer
      .subarray(
        decodeTarStringOffset,
        decodeTarStringOffset + decodeTarStringLength,
      )
      .toString("utf8")
      .replace(/\0.*/, ""),
  readTarDate = (readTarDateBuffer, readTarDateOffset, readTarDateLength) =>
    tarSecondsToDate(
      decodeTarNumber(readTarDateBuffer, readTarDateOffset, readTarDateLength),
    ),
  tarSecondsToDate = (tarEpochSeconds) =>
    tarEpochSeconds === void 0 ? void 0 : new Date(tarEpochSeconds * 1000),
  decodeTarNumber = (
    decodeTarNumberBuffer,
    decodeTarNumberOffset,
    decodeTarNumberLength,
  ) =>
    Number(decodeTarNumberBuffer[decodeTarNumberOffset]) & 128
      ? decodeTarBase256Number(
          decodeTarNumberBuffer.subarray(
            decodeTarNumberOffset,
            decodeTarNumberOffset + decodeTarNumberLength,
          ),
        )
      : decodeTarOctal(
          decodeTarNumberBuffer,
          decodeTarNumberOffset,
          decodeTarNumberLength,
        ),
  nanToUndefined = (parsedTarNumber) =>
    isNaN(parsedTarNumber) ? void 0 : parsedTarNumber,
  decodeTarOctal = (
    decodeTarOctalBuffer,
    decodeTarOctalOffset,
    decodeTarOctalLength,
  ) =>
    nanToUndefined(
      parseInt(
        decodeTarOctalBuffer
          .subarray(
            decodeTarOctalOffset,
            decodeTarOctalOffset + decodeTarOctalLength,
          )
          .toString("utf8")
          .replace(/\0.*$/, "")
          .trim(),
        8,
      ),
    ),
  tarOctalMaxByFieldLength = { 12: 8589934591, 8: 2097151 },
  encodeTarNumber = (
    encodeTarNumberBuffer,
    encodeTarNumberOffset,
    encodeTarNumberLength,
    encodeTarNumberValue,
  ) =>
    encodeTarNumberValue === void 0
      ? false
      : encodeTarNumberValue >
            tarOctalMaxByFieldLength[encodeTarNumberLength] ||
          encodeTarNumberValue < 0
        ? (encodeTarBase256Number(
            encodeTarNumberValue,
            encodeTarNumberBuffer.subarray(
              encodeTarNumberOffset,
              encodeTarNumberOffset + encodeTarNumberLength,
            ),
          ),
          true)
        : (writeTarOctalNumber(
            encodeTarNumberBuffer,
            encodeTarNumberOffset,
            encodeTarNumberLength,
            encodeTarNumberValue,
          ),
          false),
  writeTarOctalNumber = (
    writeTarOctalBuffer,
    writeTarOctalOffset,
    writeTarOctalLength,
    writeTarOctalValue,
  ) =>
    writeTarOctalBuffer.write(
      formatTarOctalNumber(writeTarOctalValue, writeTarOctalLength),
      writeTarOctalOffset,
      writeTarOctalLength,
      "ascii",
    ),
  formatTarOctalNumber = (tarOctalValue, tarOctalFieldLength) =>
    padTarOctalField(
      Math.floor(tarOctalValue).toString(8),
      tarOctalFieldLength,
    ),
  padTarOctalField = (tarOctalDigits, tarOctalFieldWidth) =>
    (tarOctalDigits.length === tarOctalFieldWidth - 1
      ? tarOctalDigits
      : Array(tarOctalFieldWidth - tarOctalDigits.length - 1).join("0") +
        tarOctalDigits +
        "\x20") + "\x00",
  writeTarDate = (
    writeTarDateBuffer,
    writeTarDateOffset,
    writeTarDateLength,
    writeTarDateValue,
  ) =>
    writeTarDateValue === void 0
      ? false
      : encodeTarNumber(
          writeTarDateBuffer,
          writeTarDateOffset,
          writeTarDateLength,
          writeTarDateValue.getTime() / 1000,
        ),
  tarNullPadding = Array(156).join("\x00"),
  writeTarString = (
    writeTarStringBuffer,
    writeTarStringOffset,
    writeTarStringLength,
    writeTarStringValue,
  ) =>
    writeTarStringValue === void 0
      ? false
      : (writeTarStringBuffer.write(
          writeTarStringValue + tarNullPadding,
          writeTarStringOffset,
          writeTarStringLength,
          "utf8",
        ),
        writeTarStringValue.length !== Buffer.byteLength(writeTarStringValue) ||
          writeTarStringValue.length > writeTarStringLength),
  PaxHeader = class {
    atime;
    mtime;
    ctime;
    charset;
    comment;
    gid;
    uid;
    gname;
    uname;
    linkpath;
    dev;
    ino;
    nlink;
    path;
    size;
    mode;
    global;
    constructor(paxHeaderFields, isGlobalPaxHeader = false) {
      (this.atime = paxHeaderFields.atime),
        (this.charset = paxHeaderFields.charset),
        (this.comment = paxHeaderFields.comment),
        (this.ctime = paxHeaderFields.ctime),
        (this.dev = paxHeaderFields.dev),
        (this.gid = paxHeaderFields.gid),
        (this.global = isGlobalPaxHeader),
        (this.gname = paxHeaderFields.gname),
        (this.ino = paxHeaderFields.ino),
        (this.linkpath = paxHeaderFields.linkpath),
        (this.mtime = paxHeaderFields.mtime),
        (this.nlink = paxHeaderFields.nlink),
        (this.path = paxHeaderFields.path),
        (this.size = paxHeaderFields.size),
        (this.uid = paxHeaderFields.uid),
        (this.uname = paxHeaderFields.uname);
    }
    encode() {
      let paxHeaderBody = this.encodeBody();
      if (paxHeaderBody === "") return Buffer.allocUnsafe(0);
      let paxHeaderBodyBytes = Buffer.byteLength(paxHeaderBody),
        paxHeaderBlockBytes = 512 * Math.ceil(1 + paxHeaderBodyBytes / 512),
        paxHeaderBuffer = Buffer.allocUnsafe(paxHeaderBlockBytes);
      for (
        let paxHeaderZeroOffset = 0;
        paxHeaderZeroOffset < 512;
        paxHeaderZeroOffset++
      )
        paxHeaderBuffer[paxHeaderZeroOffset] = 0;
      new TarHeader({
        path: ("PaxHeader/" + pathBasename(this.path ?? "")).slice(0, 99),
        mode: this.mode || 420,
        uid: this.uid,
        gid: this.gid,
        size: paxHeaderBodyBytes,
        mtime: this.mtime,
        type: this.global ? "GlobalExtendedHeader" : "ExtendedHeader",
        linkpath: "",
        uname: this.uname || "",
        gname: this.gname || "",
        devmaj: 0,
        devmin: 0,
        atime: this.atime,
        ctime: this.ctime,
      }).encode(paxHeaderBuffer),
        paxHeaderBuffer.write(paxHeaderBody, 512, paxHeaderBodyBytes, "utf8");
      for (
        let paxHeaderPaddingOffset = paxHeaderBodyBytes + 512;
        paxHeaderPaddingOffset < paxHeaderBuffer.length;
        paxHeaderPaddingOffset++
      )
        paxHeaderBuffer[paxHeaderPaddingOffset] = 0;
      return paxHeaderBuffer;
    }
    encodeBody() {
      return (
        this.encodeField("path") +
        this.encodeField("ctime") +
        this.encodeField("atime") +
        this.encodeField("dev") +
        this.encodeField("ino") +
        this.encodeField("nlink") +
        this.encodeField("charset") +
        this.encodeField("comment") +
        this.encodeField("gid") +
        this.encodeField("gname") +
        this.encodeField("linkpath") +
        this.encodeField("mtime") +
        this.encodeField("size") +
        this.encodeField("uid") +
        this.encodeField("uname")
      );
    }
    encodeField(paxFieldName) {
      if (this[paxFieldName] === void 0) return "";
      let paxFieldRawValue = this[paxFieldName],
        paxFieldEncodedValue =
          paxFieldRawValue instanceof Date
            ? paxFieldRawValue.getTime() / 1000
            : paxFieldRawValue,
        paxFieldRecordBody =
          "\x20" +
          (paxFieldName === "dev" ||
          paxFieldName === "ino" ||
          paxFieldName === "nlink"
            ? "SCHILY."
            : "") +
          paxFieldName +
          "=" +
          paxFieldEncodedValue +
          "\x0a",
        paxFieldRecordBodyBytes = Buffer.byteLength(paxFieldRecordBody),
        paxFieldLengthDigits =
          Math.floor(Math.log(paxFieldRecordBodyBytes) / Math.log(10)) + 1;
      return (
        paxFieldRecordBodyBytes + paxFieldLengthDigits >=
          Math.pow(10, paxFieldLengthDigits) && (paxFieldLengthDigits += 1),
        paxFieldLengthDigits + paxFieldRecordBodyBytes + paxFieldRecordBody
      );
    }
    static parse(paxBodyToParse, basePaxHeaders, parsedPaxIsGlobal = false) {
      return new PaxHeader(
        mergePaxHeaders(parsePaxBody(paxBodyToParse), basePaxHeaders),
        parsedPaxIsGlobal,
      );
    }
  },
  mergePaxHeaders = (localPaxHeaders, globalPaxHeaders) =>
    globalPaxHeaders
      ? Object.assign({}, globalPaxHeaders, localPaxHeaders)
      : localPaxHeaders,
  parsePaxBody = (paxBodyText) =>
    paxBodyText
      .replace(/\n$/, "")
      .split("\x0a")
      .reduce(parsePaxRecord, Object.create(null)),
  parsePaxRecord = (parsedPaxRecordFields, paxRecordText) => {
    let paxRecordDeclaredLength = parseInt(paxRecordText, 10);
    if (paxRecordDeclaredLength !== Buffer.byteLength(paxRecordText) + 1)
      return parsedPaxRecordFields;
    paxRecordText = paxRecordText.slice(
      (paxRecordDeclaredLength + "\x20").length,
    );
    let paxRecordValueParts = paxRecordText.split("="),
      paxRecordRawKey = paxRecordValueParts.shift();
    if (!paxRecordRawKey) return parsedPaxRecordFields;
    let paxRecordKey = paxRecordRawKey.replace(
        /^SCHILY\.(dev|ino|nlink)/,
        "$1",
      ),
      paxRecordValueText = paxRecordValueParts.join("=");
    return (
      (parsedPaxRecordFields[paxRecordKey] =
        /^([A-Z]+\.)?([mac]|birth|creation)time$/.test(paxRecordKey)
          ? new Date(Number(paxRecordValueText) * 1000)
          : /^[0-9]+$/.test(paxRecordValueText)
            ? +paxRecordValueText
            : paxRecordValueText),
      parsedPaxRecordFields
    );
  },
  tarPathPlatform = process.env.TESTING_TAR_FAKE_PLATFORM || process.platform,
  normalizeTarPath =
    tarPathPlatform !== "win32"
      ? (tarPathIdentityInput) => tarPathIdentityInput
      : (tarPathWin32Input) =>
          tarPathWin32Input && tarPathWin32Input.replaceAll(/\\/g, "/"),
  ReadEntry = class extends Minipass {
    extended;
    globalExtended;
    header;
    startBlockSize;
    blockRemain;
    remain;
    type;
    meta = false;
    ignore = false;
    path;
    mode;
    uid;
    gid;
    uname;
    gname;
    size = 0;
    mtime;
    atime;
    ctime;
    linkpath;
    dev;
    ino;
    nlink;
    invalid = false;
    absolute;
    unsupported = false;
    constructor(readEntryHeader, readEntryExtendedPax, readEntryGlobalPax) {
      switch (
        (super({}),
        this.pause(),
        (this.extended = readEntryExtendedPax),
        (this.globalExtended = readEntryGlobalPax),
        (this.header = readEntryHeader),
        (this.remain = readEntryHeader.size ?? 0),
        (this.startBlockSize = 512 * Math.ceil(this.remain / 512)),
        (this.blockRemain = this.startBlockSize),
        (this.type = readEntryHeader.type),
        this.type)
      ) {
        case "File":
        case "OldFile":
        case "Link":
        case "SymbolicLink":
        case "CharacterDevice":
        case "BlockDevice":
        case "Directory":
        case "FIFO":
        case "ContiguousFile":
        case "GNUDumpDir":
          break;
        case "NextFileHasLongLinkpath":
        case "NextFileHasLongPath":
        case "OldGnuLongPath":
        case "GlobalExtendedHeader":
        case "ExtendedHeader":
        case "OldExtendedHeader":
          this.meta = true;
          break;
        default:
          this.ignore = true;
      }
      if (!readEntryHeader.path)
        throw Error("no path provided for tar.ReadEntry");
      (this.path = normalizeTarPath(readEntryHeader.path)),
        (this.mode = readEntryHeader.mode),
        this.mode && (this.mode = this.mode & 4095),
        (this.uid = readEntryHeader.uid),
        (this.gid = readEntryHeader.gid),
        (this.uname = readEntryHeader.uname),
        (this.gname = readEntryHeader.gname),
        (this.size = this.remain),
        (this.mtime = readEntryHeader.mtime),
        (this.atime = readEntryHeader.atime),
        (this.ctime = readEntryHeader.ctime),
        (this.linkpath = readEntryHeader.linkpath
          ? normalizeTarPath(readEntryHeader.linkpath)
          : void 0),
        (this.uname = readEntryHeader.uname),
        (this.gname = readEntryHeader.gname),
        readEntryExtendedPax && this.#applyReadEntryPax(readEntryExtendedPax),
        readEntryGlobalPax && this.#applyReadEntryPax(readEntryGlobalPax, true);
    }
    write(readEntryWriteChunk) {
      let readEntryWriteLength = readEntryWriteChunk.length;
      if (readEntryWriteLength > this.blockRemain)
        throw Error("writing more to entry than is appropriate");
      let readEntryRemainingBytes = this.remain,
        readEntryRemainingBlockBytes = this.blockRemain;
      return (
        (this.remain = Math.max(
          0,
          readEntryRemainingBytes - readEntryWriteLength,
        )),
        (this.blockRemain = Math.max(
          0,
          readEntryRemainingBlockBytes - readEntryWriteLength,
        )),
        this.ignore
          ? true
          : readEntryRemainingBytes >= readEntryWriteLength
            ? super.write(readEntryWriteChunk)
            : super.write(
                readEntryWriteChunk.subarray(0, readEntryRemainingBytes),
              )
      );
    }
    #applyReadEntryPax(readEntryPaxFields, readEntrySkipPathFields = false) {
      readEntryPaxFields.path &&
        (readEntryPaxFields.path = normalizeTarPath(readEntryPaxFields.path)),
        readEntryPaxFields.linkpath &&
          (readEntryPaxFields.linkpath = normalizeTarPath(
            readEntryPaxFields.linkpath,
          )),
        Object.assign(
          this,
          Object.fromEntries(
            Object.entries(readEntryPaxFields).filter(
              ([readEntryPaxFieldKey, readEntryPaxFieldValue]) =>
                !(
                  readEntryPaxFieldValue == null ||
                  (readEntryPaxFieldKey === "path" && readEntrySkipPathFields)
                ),
            ),
          ),
        );
    }
  },
  emitTarWarning = (
    tarWarningEmitter,
    tarWarningCode,
    tarWarningMessage,
    tarWarningData = {},
  ) => {
    tarWarningEmitter.file && (tarWarningData.file = tarWarningEmitter.file),
      tarWarningEmitter.cwd && (tarWarningData.cwd = tarWarningEmitter.cwd),
      (tarWarningData.code =
        (tarWarningMessage instanceof Error && tarWarningMessage.code) ||
        tarWarningCode),
      (tarWarningData.tarCode = tarWarningCode),
      !tarWarningEmitter.strict && tarWarningData.recoverable !== false
        ? (tarWarningMessage instanceof Error &&
            ((tarWarningData = Object.assign(
              tarWarningMessage,
              tarWarningData,
            )),
            (tarWarningMessage = tarWarningMessage.message)),
          tarWarningEmitter.emit(
            "warn",
            tarWarningCode,
            tarWarningMessage,
            tarWarningData,
          ))
        : tarWarningMessage instanceof Error
          ? tarWarningEmitter.emit(
              "error",
              Object.assign(tarWarningMessage, tarWarningData),
            )
          : tarWarningEmitter.emit(
              "error",
              Object.assign(
                Error(tarWarningCode + ":\x20" + tarWarningMessage),
                tarWarningData,
              ),
            );
  },
  defaultMaxMetaEntrySize = 1048576,
  gzipMagicBytes = Buffer.from([31, 139]),
  zstdMagicBytes = Buffer.from([40, 181, 47, 253]),
  maxCompressionMagicLength = Math.max(
    gzipMagicBytes.length,
    zstdMagicBytes.length,
  ),
  stateSymbol = Symbol("state"),
  writeEntrySymbol = Symbol("writeEntry"),
  readEntrySymbol = Symbol("readEntry"),
  nextEntrySymbol = Symbol("nextEntry"),
  processEntrySymbol = Symbol("processEntry"),
  extendedHeaderSymbol = Symbol("extendedHeader"),
  globalExtendedHeaderSymbol = Symbol("globalExtendedHeader"),
  metaSymbol = Symbol("meta"),
  emitMetaSymbol = Symbol("emitMeta"),
  parserBufferSymbol = Symbol("buffer"),
  parserQueueSymbol = Symbol("queue"),
  parserEndedSymbol = Symbol("ended"),
  parserEmittedEndSymbol = Symbol("emittedEnd"),
  emitSymbol = Symbol("emit"),
  unzipSymbol = Symbol("unzip"),
  consumeChunkSymbol = Symbol("consumeChunk"),
  consumeChunkSubSymbol = Symbol("consumeChunkSub"),
  consumeBodySymbol = Symbol("consumeBody"),
  consumeMetaSymbol = Symbol("consumeMeta"),
  consumeHeaderSymbol = Symbol("consumeHeader"),
  consumingSymbol = Symbol("consuming"),
  bufferConcatSymbol = Symbol("bufferConcat"),
  maybeEndSymbol = Symbol("maybeEnd"),
  parserWritingSymbol = Symbol("writing"),
  parserAbortedSymbol = Symbol("aborted"),
  onDoneSymbol = Symbol("onDone"),
  sawValidEntrySymbol = Symbol("sawValidEntry"),
  sawNullBlockSymbol = Symbol("sawNullBlock"),
  sawEOFSymbol = Symbol("sawEOF"),
  closeStreamSymbol = Symbol("closeStream"),
  allowAllFilter = () => true,
  Parser = class extends parserEventEmitter {
    file;
    strict;
    maxMetaEntrySize;
    filter;
    brotli;
    zstd;
    writable = true;
    readable = false;
    [parserQueueSymbol] = [];
    [parserBufferSymbol];
    [readEntrySymbol];
    [writeEntrySymbol];
    [stateSymbol] = "begin";
    [metaSymbol] = "";
    [extendedHeaderSymbol];
    [globalExtendedHeaderSymbol];
    [parserEndedSymbol] = false;
    [unzipSymbol];
    [parserAbortedSymbol] = false;
    [sawValidEntrySymbol];
    [sawNullBlockSymbol] = false;
    [sawEOFSymbol] = false;
    [parserWritingSymbol] = false;
    [consumingSymbol] = false;
    [parserEmittedEndSymbol] = false;
    constructor(parserOptions = {}) {
      super(),
        (this.file = parserOptions.file || ""),
        this.on(onDoneSymbol, () => {
          (this[stateSymbol] === "begin" ||
            this[sawValidEntrySymbol] === false) &&
            this.warn("TAR_BAD_ARCHIVE", "Unrecognized archive format");
        }),
        parserOptions.ondone
          ? this.on(onDoneSymbol, parserOptions.ondone)
          : this.on(onDoneSymbol, () => {
              this.emit("prefinish"), this.emit("finish"), this.emit("end");
            }),
        (this.strict = !!parserOptions.strict),
        (this.maxMetaEntrySize =
          parserOptions.maxMetaEntrySize || defaultMaxMetaEntrySize),
        (this.filter =
          typeof parserOptions.filter == "function"
            ? parserOptions.filter
            : allowAllFilter);
      let parserDetectedBrotliFile =
        parserOptions.file &&
        (parserOptions.file.endsWith(".tar.br") ||
          parserOptions.file.endsWith(".tbr"));
      this.brotli =
        !(parserOptions.gzip || parserOptions.zstd) &&
        parserOptions.brotli !== void 0
          ? parserOptions.brotli
          : parserDetectedBrotliFile
            ? void 0
            : false;
      let parserDetectedZstdFile =
        parserOptions.file &&
        (parserOptions.file.endsWith(".tar.zst") ||
          parserOptions.file.endsWith(".tzst"));
      (this.zstd =
        !(parserOptions.gzip || parserOptions.brotli) &&
        parserOptions.zstd !== void 0
          ? parserOptions.zstd
          : parserDetectedZstdFile
            ? true
            : void 0),
        this.on("end", () => this[closeStreamSymbol]()),
        typeof parserOptions.onwarn == "function" &&
          this.on("warn", parserOptions.onwarn),
        typeof parserOptions.onReadEntry == "function" &&
          this.on("entry", parserOptions.onReadEntry);
    }
    warn(parserWarnCode, parserWarnMessage, parserWarnData = {}) {
      emitTarWarning(this, parserWarnCode, parserWarnMessage, parserWarnData);
    }
    [consumeHeaderSymbol](parserHeaderBuffer, parserHeaderOffset) {
      this[sawValidEntrySymbol] === void 0 &&
        (this[sawValidEntrySymbol] = false);
      let parserHeader;
      try {
        parserHeader = new TarHeader(
          parserHeaderBuffer,
          parserHeaderOffset,
          this[extendedHeaderSymbol],
          this[globalExtendedHeaderSymbol],
        );
      } catch (parserHeaderError) {
        return this.warn("TAR_ENTRY_INVALID", parserHeaderError);
      }
      if (parserHeader.nullBlock)
        this[sawNullBlockSymbol]
          ? ((this[sawEOFSymbol] = true),
            this[stateSymbol] === "begin" && (this[stateSymbol] = "header"),
            this[emitSymbol]("eof"))
          : ((this[sawNullBlockSymbol] = true), this[emitSymbol]("nullBlock"));
      else {
        if (((this[sawNullBlockSymbol] = false), !parserHeader.cksumValid))
          this.warn("TAR_ENTRY_INVALID", "checksum failure", {
            header: parserHeader,
          });
        else {
          if (!parserHeader.path)
            this.warn("TAR_ENTRY_INVALID", "path is required", {
              header: parserHeader,
            });
          else {
            let parserHeaderType = parserHeader.type;
            if (
              /^(Symbolic)?Link$/.test(parserHeaderType) &&
              !parserHeader.linkpath
            )
              this.warn("TAR_ENTRY_INVALID", "linkpath required", {
                header: parserHeader,
              });
            else {
              if (
                !/^(Symbolic)?Link$/.test(parserHeaderType) &&
                !/^(Global)?ExtendedHeader$/.test(parserHeaderType) &&
                parserHeader.linkpath
              )
                this.warn("TAR_ENTRY_INVALID", "linkpath forbidden", {
                  header: parserHeader,
                });
              else {
                let parserReadEntry = (this[writeEntrySymbol] = new ReadEntry(
                  parserHeader,
                  this[extendedHeaderSymbol],
                  this[globalExtendedHeaderSymbol],
                ));
                if (!this[sawValidEntrySymbol]) {
                  if (parserReadEntry.remain) {
                    let markParserSawValidEntry = () => {
                      parserReadEntry.invalid ||
                        (this[sawValidEntrySymbol] = true);
                    };
                    parserReadEntry.on("end", markParserSawValidEntry);
                  } else this[sawValidEntrySymbol] = true;
                }
                parserReadEntry.meta
                  ? parserReadEntry.size > this.maxMetaEntrySize
                    ? ((parserReadEntry.ignore = true),
                      this[emitSymbol]("ignoredEntry", parserReadEntry),
                      (this[stateSymbol] = "ignore"),
                      parserReadEntry.resume())
                    : parserReadEntry.size > 0 &&
                      ((this[metaSymbol] = ""),
                      parserReadEntry.on(
                        "data",
                        (parserMetaChunk) =>
                          (this[metaSymbol] += parserMetaChunk),
                      ),
                      (this[stateSymbol] = "meta"))
                  : ((this[extendedHeaderSymbol] = void 0),
                    (parserReadEntry.ignore =
                      parserReadEntry.ignore ||
                      !this.filter(parserReadEntry.path, parserReadEntry)),
                    parserReadEntry.ignore
                      ? (this[emitSymbol]("ignoredEntry", parserReadEntry),
                        (this[stateSymbol] = parserReadEntry.remain
                          ? "ignore"
                          : "header"),
                        parserReadEntry.resume())
                      : (parserReadEntry.remain
                          ? (this[stateSymbol] = "body")
                          : ((this[stateSymbol] = "header"),
                            parserReadEntry.end()),
                        this[readEntrySymbol]
                          ? this[parserQueueSymbol].push(parserReadEntry)
                          : (this[parserQueueSymbol].push(parserReadEntry),
                            this[nextEntrySymbol]())));
              }
            }
          }
        }
      }
    }
    [closeStreamSymbol]() {
      queueMicrotask(() => this.emit("close"));
    }
    [processEntrySymbol](parserQueuedEntry) {
      let parserShouldProcessMore = true;
      if (!parserQueuedEntry)
        (this[readEntrySymbol] = void 0), (parserShouldProcessMore = false);
      else {
        if (Array.isArray(parserQueuedEntry)) {
          let [parserQueuedEventName, ...parserQueuedEventArgs] =
            parserQueuedEntry;
          this.emit(parserQueuedEventName, ...parserQueuedEventArgs);
        } else
          (this[readEntrySymbol] = parserQueuedEntry),
            this.emit("entry", parserQueuedEntry),
            parserQueuedEntry.emittedEnd ||
              (parserQueuedEntry.on("end", () => this[nextEntrySymbol]()),
              (parserShouldProcessMore = false));
      }
      return parserShouldProcessMore;
    }
    [nextEntrySymbol]() {
      do;
      while (this[processEntrySymbol](this[parserQueueSymbol].shift()));
      if (this[parserQueueSymbol].length === 0) {
        let parserCurrentReadEntry = this[readEntrySymbol];
        !parserCurrentReadEntry ||
        parserCurrentReadEntry.flowing ||
        parserCurrentReadEntry.size === parserCurrentReadEntry.remain
          ? this[parserWritingSymbol] || this.emit("drain")
          : parserCurrentReadEntry.once("drain", () => this.emit("drain"));
      }
    }
    [consumeBodySymbol](parserBodyBuffer, parserBodyOffset) {
      let parserBodyEntry = this[writeEntrySymbol];
      if (!parserBodyEntry)
        throw Error("attempt to consume body without entry??");
      let parserBodyBlockRemain = parserBodyEntry.blockRemain ?? 0,
        parserBodySlice =
          parserBodyBlockRemain >= parserBodyBuffer.length &&
          parserBodyOffset === 0
            ? parserBodyBuffer
            : parserBodyBuffer.subarray(
                parserBodyOffset,
                parserBodyOffset + parserBodyBlockRemain,
              );
      return (
        parserBodyEntry.write(parserBodySlice),
        parserBodyEntry.blockRemain ||
          ((this[stateSymbol] = "header"),
          (this[writeEntrySymbol] = void 0),
          parserBodyEntry.end()),
        parserBodySlice.length
      );
    }
    [consumeMetaSymbol](parserMetaBuffer, parserMetaOffset) {
      let parserMetaEntry = this[writeEntrySymbol],
        parserMetaBytesConsumed = this[consumeBodySymbol](
          parserMetaBuffer,
          parserMetaOffset,
        );
      return (
        !this[writeEntrySymbol] &&
          parserMetaEntry &&
          this[emitMetaSymbol](parserMetaEntry),
        parserMetaBytesConsumed
      );
    }
    [emitSymbol](parserEmitEvent, parserEmitArg1, parserEmitArg2) {
      this[parserQueueSymbol].length === 0 && !this[readEntrySymbol]
        ? this.emit(parserEmitEvent, parserEmitArg1, parserEmitArg2)
        : this[parserQueueSymbol].push([
            parserEmitEvent,
            parserEmitArg1,
            parserEmitArg2,
          ]);
    }
    [emitMetaSymbol](parserEmittedMetaEntry) {
      switch (
        (this[emitSymbol]("meta", this[metaSymbol]),
        parserEmittedMetaEntry.type)
      ) {
        case "ExtendedHeader":
        case "OldExtendedHeader":
          this[extendedHeaderSymbol] = PaxHeader.parse(
            this[metaSymbol],
            this[extendedHeaderSymbol],
            false,
          );
          break;
        case "GlobalExtendedHeader":
          this[globalExtendedHeaderSymbol] = PaxHeader.parse(
            this[metaSymbol],
            this[globalExtendedHeaderSymbol],
            true,
          );
          break;
        case "NextFileHasLongPath":
        case "OldGnuLongPath": {
          let parserLongPathPax =
            this[extendedHeaderSymbol] ?? Object.create(null);
          (this[extendedHeaderSymbol] = parserLongPathPax),
            (parserLongPathPax.path = this[metaSymbol].replace(/\0.*/, ""));
          break;
        }
        case "NextFileHasLongLinkpath": {
          let parserLongLinkpathPax =
            this[extendedHeaderSymbol] || Object.create(null);
          (this[extendedHeaderSymbol] = parserLongLinkpathPax),
            (parserLongLinkpathPax.linkpath = this[metaSymbol].replace(
              /\0.*/,
              "",
            ));
          break;
        }
        default:
          throw Error("unknown meta: " + parserEmittedMetaEntry.type);
      }
    }
    abort(parserAbortError) {
      (this[parserAbortedSymbol] = true),
        this.emit("abort", parserAbortError),
        this.warn("TAR_ABORT", parserAbortError, { recoverable: false });
    }
    write(parserWriteChunk, parserWriteEncoding, parserWriteCallback) {
      if (
        (typeof parserWriteEncoding == "function" &&
          ((parserWriteCallback = parserWriteEncoding),
          (parserWriteEncoding = void 0)),
        typeof parserWriteChunk == "string" &&
          (parserWriteChunk = Buffer.from(
            parserWriteChunk,
            typeof parserWriteEncoding == "string"
              ? parserWriteEncoding
              : "utf8",
          )),
        this[parserAbortedSymbol])
      )
        return parserWriteCallback?.(), false;
      if (
        (this[unzipSymbol] === void 0 ||
          (this.brotli === void 0 && this[unzipSymbol] === false)) &&
        parserWriteChunk
      ) {
        if (
          (this[parserBufferSymbol] &&
            ((parserWriteChunk = Buffer.concat([
              this[parserBufferSymbol],
              parserWriteChunk,
            ])),
            (this[parserBufferSymbol] = void 0)),
          parserWriteChunk.length < maxCompressionMagicLength)
        )
          return (
            (this[parserBufferSymbol] = parserWriteChunk),
            parserWriteCallback?.(),
            true
          );
        for (
          let parserGzipMagicIndex = 0;
          this[unzipSymbol] === void 0 &&
          parserGzipMagicIndex < gzipMagicBytes.length;
          parserGzipMagicIndex++
        )
          parserWriteChunk[parserGzipMagicIndex] !==
            gzipMagicBytes[parserGzipMagicIndex] && (this[unzipSymbol] = false);
        let parserDetectedZstdMagic = false;
        if (this[unzipSymbol] === false && this.zstd !== false) {
          parserDetectedZstdMagic = true;
          for (
            let parserZstdMagicIndex = 0;
            parserZstdMagicIndex < zstdMagicBytes.length;
            parserZstdMagicIndex++
          )
            if (
              parserWriteChunk[parserZstdMagicIndex] !==
              zstdMagicBytes[parserZstdMagicIndex]
            ) {
              parserDetectedZstdMagic = false;
              break;
            }
        }
        let parserShouldProbeBrotli =
          this.brotli === void 0 && !parserDetectedZstdMagic;
        if (this[unzipSymbol] === false && parserShouldProbeBrotli) {
          if (parserWriteChunk.length < 512) {
            if (this[parserEndedSymbol]) this.brotli = true;
            else
              return (
                (this[parserBufferSymbol] = parserWriteChunk),
                parserWriteCallback?.(),
                true
              );
          } else
            try {
              new TarHeader(parserWriteChunk.subarray(0, 512)),
                (this.brotli = false);
            } catch {
              this.brotli = true;
            }
        }
        if (
          this[unzipSymbol] === void 0 ||
          (this[unzipSymbol] === false &&
            (this.brotli || parserDetectedZstdMagic))
        ) {
          let parserEndedBeforeUnzip = this[parserEndedSymbol];
          (this[parserEndedSymbol] = false),
            (this[unzipSymbol] =
              this[unzipSymbol] === void 0
                ? new Unzip({})
                : parserDetectedZstdMagic
                  ? new ZstdDecompress({})
                  : new BrotliDecompress({})),
            this[unzipSymbol].on("data", (parserUnzipDataChunk) =>
              this[consumeChunkSymbol](parserUnzipDataChunk),
            ),
            this[unzipSymbol].on("error", (parserUnzipError) =>
              this.abort(parserUnzipError),
            ),
            this[unzipSymbol].on("end", () => {
              (this[parserEndedSymbol] = true), this[consumeChunkSymbol]();
            }),
            (this[parserWritingSymbol] = true);
          let parserUnzipWriteResult =
            !!this[unzipSymbol][parserEndedBeforeUnzip ? "end" : "write"](
              parserWriteChunk,
            );
          return (
            (this[parserWritingSymbol] = false),
            parserWriteCallback?.(),
            parserUnzipWriteResult
          );
        }
      }
      (this[parserWritingSymbol] = true),
        this[unzipSymbol]
          ? this[unzipSymbol].write(parserWriteChunk)
          : this[consumeChunkSymbol](parserWriteChunk),
        (this[parserWritingSymbol] = false);
      let parserWriteShouldContinue =
        this[parserQueueSymbol].length > 0
          ? false
          : this[readEntrySymbol]
            ? this[readEntrySymbol].flowing
            : true;
      return (
        !parserWriteShouldContinue &&
          this[parserQueueSymbol].length === 0 &&
          this[readEntrySymbol]?.once("drain", () => this.emit("drain")),
        parserWriteCallback?.(),
        parserWriteShouldContinue
      );
    }
    [bufferConcatSymbol](parserBufferConcatChunk) {
      parserBufferConcatChunk &&
        !this[parserAbortedSymbol] &&
        (this[parserBufferSymbol] = this[parserBufferSymbol]
          ? Buffer.concat([this[parserBufferSymbol], parserBufferConcatChunk])
          : parserBufferConcatChunk);
    }
    [maybeEndSymbol]() {
      if (
        this[parserEndedSymbol] &&
        !this[parserEmittedEndSymbol] &&
        !this[parserAbortedSymbol] &&
        !this[consumingSymbol]
      ) {
        this[parserEmittedEndSymbol] = true;
        let parserFinalEntry = this[writeEntrySymbol];
        if (parserFinalEntry && parserFinalEntry.blockRemain) {
          let parserAvailableBufferedBytes = this[parserBufferSymbol]
            ? this[parserBufferSymbol].length
            : 0;
          this.warn(
            "TAR_BAD_ARCHIVE",
            "Truncated input (needed " +
              parserFinalEntry.blockRemain +
              " more bytes, only " +
              parserAvailableBufferedBytes +
              " available)",
            { entry: parserFinalEntry },
          ),
            this[parserBufferSymbol] &&
              parserFinalEntry.write(this[parserBufferSymbol]),
            parserFinalEntry.end();
        }
        this[emitSymbol](onDoneSymbol);
      }
    }
    [consumeChunkSymbol](parserConsumeChunk) {
      if (this[consumingSymbol] && parserConsumeChunk)
        this[bufferConcatSymbol](parserConsumeChunk);
      else {
        if (!parserConsumeChunk && !this[parserBufferSymbol])
          this[maybeEndSymbol]();
        else {
          if (parserConsumeChunk) {
            if (((this[consumingSymbol] = true), this[parserBufferSymbol])) {
              this[bufferConcatSymbol](parserConsumeChunk);
              let parserCombinedChunk = this[parserBufferSymbol];
              (this[parserBufferSymbol] = void 0),
                this[consumeChunkSubSymbol](parserCombinedChunk);
            } else this[consumeChunkSubSymbol](parserConsumeChunk);
            for (
              ;
              this[parserBufferSymbol] &&
              this[parserBufferSymbol]?.length >= 512 &&
              !this[parserAbortedSymbol] &&
              !this[sawEOFSymbol];

            ) {
              let parserBufferedChunk = this[parserBufferSymbol];
              (this[parserBufferSymbol] = void 0),
                this[consumeChunkSubSymbol](parserBufferedChunk);
            }
            this[consumingSymbol] = false;
          }
        }
      }
      (!this[parserBufferSymbol] || this[parserEndedSymbol]) &&
        this[maybeEndSymbol]();
    }
    [consumeChunkSubSymbol](parserChunkSubBuffer) {
      let parserChunkOffset = 0,
        parserChunkLength = parserChunkSubBuffer.length;
      for (
        ;
        parserChunkOffset + 512 <= parserChunkLength &&
        !this[parserAbortedSymbol] &&
        !this[sawEOFSymbol];

      )
        switch (this[stateSymbol]) {
          case "begin":
          case "header":
            this[consumeHeaderSymbol](parserChunkSubBuffer, parserChunkOffset),
              (parserChunkOffset += 512);
            break;
          case "ignore":
          case "body":
            parserChunkOffset += this[consumeBodySymbol](
              parserChunkSubBuffer,
              parserChunkOffset,
            );
            break;
          case "meta":
            parserChunkOffset += this[consumeMetaSymbol](
              parserChunkSubBuffer,
              parserChunkOffset,
            );
            break;
          default:
            throw Error("invalid state: " + this[stateSymbol]);
        }
      parserChunkOffset < parserChunkLength &&
        (this[parserBufferSymbol] = this[parserBufferSymbol]
          ? Buffer.concat([
              parserChunkSubBuffer.subarray(parserChunkOffset),
              this[parserBufferSymbol],
            ])
          : parserChunkSubBuffer.subarray(parserChunkOffset));
    }
    end(parserEndChunk, parserEndEncoding, parserEndCallback) {
      return (
        typeof parserEndChunk == "function" &&
          ((parserEndCallback = parserEndChunk),
          (parserEndEncoding = void 0),
          (parserEndChunk = void 0)),
        typeof parserEndEncoding == "function" &&
          ((parserEndCallback = parserEndEncoding),
          (parserEndEncoding = void 0)),
        typeof parserEndChunk == "string" &&
          (parserEndChunk = Buffer.from(parserEndChunk, parserEndEncoding)),
        parserEndCallback && this.once("finish", parserEndCallback),
        this[parserAbortedSymbol] ||
          (this[unzipSymbol]
            ? (parserEndChunk && this[unzipSymbol].write(parserEndChunk),
              this[unzipSymbol].end())
            : ((this[parserEndedSymbol] = true),
              (this.brotli === void 0 || this.zstd === void 0) &&
                (parserEndChunk = parserEndChunk || Buffer.alloc(0)),
              parserEndChunk && this.write(parserEndChunk),
              this[maybeEndSymbol]())),
        this
      );
    }
  },
  stripTrailingSlashes = (pathWithTrailingSlashes) => {
    let trailingSlashScanIndex = pathWithTrailingSlashes.length - 1,
      firstTrailingSlashIndex = -1;
    for (
      ;
      trailingSlashScanIndex > -1 &&
      pathWithTrailingSlashes.charAt(trailingSlashScanIndex) === "/";

    )
      (firstTrailingSlashIndex = trailingSlashScanIndex),
        trailingSlashScanIndex--;
    return firstTrailingSlashIndex === -1
      ? pathWithTrailingSlashes
      : pathWithTrailingSlashes.slice(0, firstTrailingSlashIndex);
  },
  autoResumeTarEntries = (tarAutoResumeOptions) => {
    let originalOnReadEntry = tarAutoResumeOptions.onReadEntry;
    tarAutoResumeOptions.onReadEntry = originalOnReadEntry
      ? (autoResumeReadEntry) => {
          originalOnReadEntry(autoResumeReadEntry),
            autoResumeReadEntry.resume();
        }
      : (defaultAutoResumeEntry) => defaultAutoResumeEntry.resume();
  },
  applyPathFilter = (tarPathFilterOptions, tarPathFilterPaths) => {
    let tarPathFilterCache = new Map(
        tarPathFilterPaths.map((tarPathFilterInputPath) => [
          stripTrailingSlashes(tarPathFilterInputPath),
          true,
        ]),
      ),
      originalTarPathFilter = tarPathFilterOptions.filter,
      pathMatchesTarFilter = (
        tarPathFilterCandidate,
        tarPathFilterRoot = "",
      ) => {
        let tarPathFilterRootPath =
            tarPathFilterRoot || pathParse(tarPathFilterCandidate).root || ".",
          tarPathFilterDecision;
        if (tarPathFilterCandidate === tarPathFilterRootPath)
          tarPathFilterDecision = false;
        else {
          let cachedTarPathDecision = tarPathFilterCache.get(
            tarPathFilterCandidate,
          );
          tarPathFilterDecision =
            cachedTarPathDecision !== void 0
              ? cachedTarPathDecision
              : pathMatchesTarFilter(
                  pathDirname(tarPathFilterCandidate),
                  tarPathFilterRootPath,
                );
        }
        return (
          tarPathFilterCache.set(tarPathFilterCandidate, tarPathFilterDecision),
          tarPathFilterDecision
        );
      };
    tarPathFilterOptions.filter = originalTarPathFilter
      ? (filteredTarEntryPath, filteredTarEntry) =>
          originalTarPathFilter(filteredTarEntryPath, filteredTarEntry) &&
          pathMatchesTarFilter(stripTrailingSlashes(filteredTarEntryPath))
      : (defaultFilteredTarPath) =>
          pathMatchesTarFilter(stripTrailingSlashes(defaultFilteredTarPath));
  },
  listFileSync = (tarListSyncOptions) => {
    let tarListSyncParser = new Parser(tarListSyncOptions),
      tarListSyncFile = tarListSyncOptions.file,
      tarListSyncFd;
    try {
      tarListSyncFd = tarListFs.openSync(tarListSyncFile, "r");
      let tarListSyncStat = tarListFs.fstatSync(tarListSyncFd),
        tarListMaxReadSize = tarListSyncOptions.maxReadSize || 16777216;
      if (tarListSyncStat.size < tarListMaxReadSize) {
        let tarListWholeFileBuffer = Buffer.allocUnsafe(tarListSyncStat.size),
          tarListWholeFileBytesRead = tarListFs.readSync(
            tarListSyncFd,
            tarListWholeFileBuffer,
            0,
            tarListSyncStat.size,
            0,
          );
        tarListSyncParser.end(
          tarListWholeFileBytesRead === tarListWholeFileBuffer.byteLength
            ? tarListWholeFileBuffer
            : tarListWholeFileBuffer.subarray(0, tarListWholeFileBytesRead),
        );
      } else {
        let tarListReadPosition = 0,
          tarListChunkBuffer = Buffer.allocUnsafe(tarListMaxReadSize);
        for (; tarListReadPosition < tarListSyncStat.size; ) {
          let tarListChunkBytesRead = tarListFs.readSync(
            tarListSyncFd,
            tarListChunkBuffer,
            0,
            tarListMaxReadSize,
            tarListReadPosition,
          );
          if (tarListChunkBytesRead === 0) break;
          (tarListReadPosition += tarListChunkBytesRead),
            tarListSyncParser.write(
              tarListChunkBuffer.subarray(0, tarListChunkBytesRead),
            );
        }
        tarListSyncParser.end();
      }
    } finally {
      if (typeof tarListSyncFd == "number")
        try {
          tarListFs.closeSync(tarListSyncFd);
        } catch {}
    }
  },
  listFileAsync = (tarListAsyncOptions, tarListAsyncCallback) => {
    let tarListAsyncParser = new Parser(tarListAsyncOptions),
      tarListAsyncReadSize = tarListAsyncOptions.maxReadSize || 16777216,
      tarListAsyncFile = tarListAsyncOptions.file;
    return new Promise((resolveTarListAsync, rejectTarListAsync) => {
      tarListAsyncParser.on("error", rejectTarListAsync),
        tarListAsyncParser.on("end", resolveTarListAsync),
        tarListFs.stat(
          tarListAsyncFile,
          (tarListStatError, tarListAsyncStat) => {
            if (tarListStatError) rejectTarListAsync(tarListStatError);
            else {
              let tarListReadStream = new ReadStream(tarListAsyncFile, {
                readSize: tarListAsyncReadSize,
                size: tarListAsyncStat.size,
              });
              tarListReadStream.on("error", rejectTarListAsync),
                tarListReadStream.pipe(tarListAsyncParser);
            }
          },
        );
    });
  },
  tarList = createTarFacade(
    listFileSync,
    listFileAsync,
    (tarListSyncNoFileOptions) => new Parser(tarListSyncNoFileOptions),
    (tarListAsyncNoFileOptions) => new Parser(tarListAsyncNoFileOptions),
    (tarListValidateOptions, tarListValidatePaths) => {
      tarListValidatePaths?.length &&
        applyPathFilter(tarListValidateOptions, tarListValidatePaths),
        tarListValidateOptions.noResume ||
          autoResumeTarEntries(tarListValidateOptions);
    },
  ),
  normalizeTarMode = (
    tarModeToNormalize,
    tarNormalizeModePortable,
    tarNormalizeModeExecutable,
  ) => (
    (tarModeToNormalize &= 4095),
    tarNormalizeModeExecutable &&
      (tarModeToNormalize = (tarModeToNormalize | 384) & -19),
    tarNormalizeModePortable &&
      (tarModeToNormalize & 256 && (tarModeToNormalize |= 64),
      tarModeToNormalize & 32 && (tarModeToNormalize |= 8),
      tarModeToNormalize & 4 && (tarModeToNormalize |= 1)),
    tarModeToNormalize
  ),
  { isAbsolute: fZ, parse: j4 } = win32Path,
  splitAbsolutePath = (absoluteTarPathRemainder) => {
    let absoluteTarPathRoot = "",
      absoluteTarPathParsed = j4(absoluteTarPathRemainder);
    for (; fZ(absoluteTarPathRemainder) || absoluteTarPathParsed.root; ) {
      let absoluteTarRootPart =
        absoluteTarPathRemainder.charAt(0) === "/" &&
        absoluteTarPathRemainder.slice(0, 4) !== "//?/"
          ? "/"
          : absoluteTarPathParsed.root;
      (absoluteTarPathRemainder = absoluteTarPathRemainder.slice(
        absoluteTarRootPart.length,
      )),
        (absoluteTarPathRoot += absoluteTarRootPart),
        (absoluteTarPathParsed = j4(absoluteTarPathRemainder));
    }
    return [absoluteTarPathRoot, absoluteTarPathRemainder];
  },
  winReservedChars = ["|", "<", ">", "?", ":"],
  winReservedEncodedChars = winReservedChars.map((winReservedChar) =>
    String.fromCodePoint(61440 + Number(winReservedChar.codePointAt(0))),
  ),
  winReservedEncodeMap = new Map(
    winReservedChars.map((winReservedEncodeChar, winReservedEncodeIndex) => [
      winReservedEncodeChar,
      winReservedEncodedChars[winReservedEncodeIndex],
    ]),
  ),
  winReservedDecodeMap = new Map(
    winReservedEncodedChars.map(
      (winReservedEncodedChar, winReservedDecodeIndex) => [
        winReservedEncodedChar,
        winReservedChars[winReservedDecodeIndex],
      ],
    ),
  ),
  encodeWin32Path = (win32PathToEncode) =>
    winReservedChars.reduce(
      (win32EncodedPathAccumulator, win32ReservedCharToEncode) =>
        win32EncodedPathAccumulator
          .split(win32ReservedCharToEncode)
          .join(winReservedEncodeMap.get(win32ReservedCharToEncode)),
      win32PathToEncode,
    ),
  decodeWin32Path = (win32PathToDecode) =>
    winReservedEncodedChars.reduce(
      (win32DecodedPathAccumulator, win32EncodedCharToDecode) =>
        win32DecodedPathAccumulator
          .split(win32EncodedCharToDecode)
          .join(winReservedDecodeMap.get(win32EncodedCharToDecode)),
      win32PathToDecode,
    ),
  applyTarPrefix = (tarPrefixPath, tarEntryPrefix) =>
    tarEntryPrefix
      ? ((tarPrefixPath = normalizeTarPath(tarPrefixPath).replace(
          /^\.(\/|$)/,
          "",
        )),
        stripTrailingSlashes(tarEntryPrefix) + "/" + tarPrefixPath)
      : normalizeTarPath(tarPrefixPath),
  defaultMaxReadSize = 16777216,
  processSymbol = Symbol("process"),
  fileSymbol = Symbol("file"),
  directorySymbol = Symbol("directory"),
  symlinkSymbol = Symbol("symlink"),
  hardlinkSymbol = Symbol("hardlink"),
  headerSymbol = Symbol("header"),
  writeEntryReadSymbol = Symbol("read"),
  lstatSymbol = Symbol("lstat"),
  onlstatSymbol = Symbol("onlstat"),
  writeEntryOnReadSymbol = Symbol("onread"),
  onreadlinkSymbol = Symbol("onreadlink"),
  openfileSymbol = Symbol("openfile"),
  onopenfileSymbol = Symbol("onopenfile"),
  writeEntryCloseSymbol = Symbol("close"),
  writeEntryModeSymbol = Symbol("mode"),
  awaitDrainSymbol = Symbol("awaitDrain"),
  ondrainSymbol = Symbol("ondrain"),
  prefixSymbol = Symbol("prefix"),
  WriteEntry = class extends Minipass {
    path;
    portable;
    myuid = (process.getuid && process.getuid()) || 0;
    myuser = process.env.USER || "";
    maxReadSize;
    linkCache;
    statCache;
    preservePaths;
    cwd;
    strict;
    mtime;
    noPax;
    noMtime;
    prefix;
    fd;
    blockLen = 0;
    blockRemain = 0;
    buf;
    pos = 0;
    remain = 0;
    length = 0;
    offset = 0;
    win32;
    absolute;
    header;
    type;
    linkpath;
    stat;
    onWriteEntry;
    #writeEntrySawError = false;
    constructor(writeEntryPathInput, writeEntryRawOptions = {}) {
      let writeEntryOptions = normalizeTarOptions(writeEntryRawOptions);
      super(),
        (this.path = normalizeTarPath(writeEntryPathInput)),
        (this.portable = !!writeEntryOptions.portable),
        (this.maxReadSize =
          writeEntryOptions.maxReadSize || defaultMaxReadSize),
        (this.linkCache = writeEntryOptions.linkCache || new Map()),
        (this.statCache = writeEntryOptions.statCache || new Map()),
        (this.preservePaths = !!writeEntryOptions.preservePaths),
        (this.cwd = normalizeTarPath(writeEntryOptions.cwd || process.cwd())),
        (this.strict = !!writeEntryOptions.strict),
        (this.noPax = !!writeEntryOptions.noPax),
        (this.noMtime = !!writeEntryOptions.noMtime),
        (this.mtime = writeEntryOptions.mtime),
        (this.prefix = writeEntryOptions.prefix
          ? normalizeTarPath(writeEntryOptions.prefix)
          : void 0),
        (this.onWriteEntry = writeEntryOptions.onWriteEntry),
        typeof writeEntryOptions.onwarn == "function" &&
          this.on("warn", writeEntryOptions.onwarn);
      let writeEntryStrippedRoot = false;
      if (!this.preservePaths) {
        let [writeEntryAbsoluteRoot, writeEntryRelativePath] =
          splitAbsolutePath(this.path);
        writeEntryAbsoluteRoot &&
          typeof writeEntryRelativePath == "string" &&
          ((this.path = writeEntryRelativePath),
          (writeEntryStrippedRoot = writeEntryAbsoluteRoot));
      }
      (this.win32 = !!writeEntryOptions.win32 || process.platform === "win32"),
        this.win32 &&
          ((this.path = decodeWin32Path(this.path.replaceAll(/\\/g, "/"))),
          (writeEntryPathInput = writeEntryPathInput.replaceAll(/\\/g, "/"))),
        (this.absolute = normalizeTarPath(
          writeEntryOptions.absolute ||
            writeEntryPath.resolve(this.cwd, writeEntryPathInput),
        )),
        this.path === "" && (this.path = "./"),
        writeEntryStrippedRoot &&
          this.warn(
            "TAR_ENTRY_INFO",
            "stripping " + writeEntryStrippedRoot + " from absolute path",
            { entry: this, path: writeEntryStrippedRoot + this.path },
          );
      let writeEntryCachedStat = this.statCache.get(this.absolute);
      writeEntryCachedStat
        ? this[onlstatSymbol](writeEntryCachedStat)
        : this[lstatSymbol]();
    }
    warn(writeEntryWarnCode, writeEntryWarnMessage, writeEntryWarnData = {}) {
      return emitTarWarning(
        this,
        writeEntryWarnCode,
        writeEntryWarnMessage,
        writeEntryWarnData,
      );
    }
    emit(writeEntryEmitEvent, ...writeEntryEmitArgs) {
      return (
        writeEntryEmitEvent === "error" && (this.#writeEntrySawError = true),
        super.emit(writeEntryEmitEvent, ...writeEntryEmitArgs)
      );
    }
    [lstatSymbol]() {
      writeEntryFs.lstat(
        this.absolute,
        (writeEntryLstatError, writeEntryLstatResult) => {
          if (writeEntryLstatError)
            return this.emit("error", writeEntryLstatError);
          this[onlstatSymbol](writeEntryLstatResult);
        },
      );
    }
    [onlstatSymbol](writeEntryStat) {
      this.statCache.set(this.absolute, writeEntryStat),
        (this.stat = writeEntryStat),
        writeEntryStat.isFile() || (writeEntryStat.size = 0),
        (this.type = getTarType(writeEntryStat)),
        this.emit("stat", writeEntryStat),
        this[processSymbol]();
    }
    [processSymbol]() {
      switch (this.type) {
        case "File":
          return this[fileSymbol]();
        case "Directory":
          return this[directorySymbol]();
        case "SymbolicLink":
          return this[symlinkSymbol]();
        default:
          return this.end();
      }
    }
    [writeEntryModeSymbol](writeEntryMode) {
      return normalizeTarMode(
        writeEntryMode,
        this.type === "Directory",
        this.portable,
      );
    }
    [prefixSymbol](writeEntryPrefixPath) {
      return applyTarPrefix(writeEntryPrefixPath, this.prefix);
    }
    [headerSymbol]() {
      if (!this.stat) throw Error("cannot write header before stat");
      this.type === "Directory" && this.portable && (this.noMtime = true),
        this.onWriteEntry?.(this),
        (this.header = new TarHeader({
          path: this[prefixSymbol](this.path),
          linkpath:
            this.type === "Link" && this.linkpath !== void 0
              ? this[prefixSymbol](this.linkpath)
              : this.linkpath,
          mode: this[writeEntryModeSymbol](this.stat.mode),
          uid: this.portable ? void 0 : this.stat.uid,
          gid: this.portable ? void 0 : this.stat.gid,
          size: this.stat.size,
          mtime: this.noMtime ? void 0 : this.mtime || this.stat.mtime,
          type: this.type === "Unsupported" ? void 0 : this.type,
          uname: this.portable
            ? void 0
            : this.stat.uid === this.myuid
              ? this.myuser
              : "",
          atime: this.portable ? void 0 : this.stat.atime,
          ctime: this.portable ? void 0 : this.stat.ctime,
        })),
        this.header.encode() &&
          !this.noPax &&
          super.write(
            new PaxHeader({
              atime: this.portable ? void 0 : this.header.atime,
              ctime: this.portable ? void 0 : this.header.ctime,
              gid: this.portable ? void 0 : this.header.gid,
              mtime: this.noMtime ? void 0 : this.mtime || this.header.mtime,
              path: this[prefixSymbol](this.path),
              linkpath:
                this.type === "Link" && this.linkpath !== void 0
                  ? this[prefixSymbol](this.linkpath)
                  : this.linkpath,
              size: this.header.size,
              uid: this.portable ? void 0 : this.header.uid,
              uname: this.portable ? void 0 : this.header.uname,
              dev: this.portable ? void 0 : this.stat.dev,
              ino: this.portable ? void 0 : this.stat.ino,
              nlink: this.portable ? void 0 : this.stat.nlink,
            }).encode(),
          );
      let writeEntryHeaderBlock = this.header?.block;
      if (!writeEntryHeaderBlock) throw Error("failed to encode header");
      super.write(writeEntryHeaderBlock);
    }
    [directorySymbol]() {
      if (!this.stat) throw Error("cannot create directory entry without stat");
      this.path.slice(-1) !== "/" && (this.path += "/"),
        (this.stat.size = 0),
        this[headerSymbol](),
        this.end();
    }
    [symlinkSymbol]() {
      writeEntryFs.readlink(
        this.absolute,
        (writeEntryReadlinkError, writeEntryReadlinkTarget) => {
          if (writeEntryReadlinkError)
            return this.emit("error", writeEntryReadlinkError);
          this[onreadlinkSymbol](writeEntryReadlinkTarget);
        },
      );
    }
    [onreadlinkSymbol](writeEntryLinkPath) {
      (this.linkpath = normalizeTarPath(writeEntryLinkPath)),
        this[headerSymbol](),
        this.end();
    }
    [hardlinkSymbol](writeEntryHardlinkTarget) {
      if (!this.stat) throw Error("cannot create link entry without stat");
      (this.type = "Link"),
        (this.linkpath = normalizeTarPath(
          writeEntryPath.relative(this.cwd, writeEntryHardlinkTarget),
        )),
        (this.stat.size = 0),
        this[headerSymbol](),
        this.end();
    }
    [fileSymbol]() {
      if (!this.stat) throw Error("cannot create file entry without stat");
      if (this.stat.nlink > 1) {
        let writeEntryInodeKey = this.stat.dev + ":" + this.stat.ino,
          writeEntryCachedLinkPath = this.linkCache.get(writeEntryInodeKey);
        if (writeEntryCachedLinkPath?.indexOf(this.cwd) === 0)
          return this[hardlinkSymbol](writeEntryCachedLinkPath);
        this.linkCache.set(writeEntryInodeKey, this.absolute);
      }
      if ((this[headerSymbol](), this.stat.size === 0)) return this.end();
      this[openfileSymbol]();
    }
    [openfileSymbol]() {
      writeEntryFs.open(
        this.absolute,
        "r",
        (writeEntryOpenError, writeEntryOpenedFd) => {
          if (writeEntryOpenError)
            return this.emit("error", writeEntryOpenError);
          this[onopenfileSymbol](writeEntryOpenedFd);
        },
      );
    }
    [onopenfileSymbol](writeEntryFd) {
      if (((this.fd = writeEntryFd), this.#writeEntrySawError))
        return this[writeEntryCloseSymbol]();
      if (!this.stat) throw Error("should stat before calling onopenfile");
      (this.blockLen = 512 * Math.ceil(this.stat.size / 512)),
        (this.blockRemain = this.blockLen);
      let writeEntryReadBufferSize = Math.min(this.blockLen, this.maxReadSize);
      (this.buf = Buffer.allocUnsafe(writeEntryReadBufferSize)),
        (this.offset = 0),
        (this.pos = 0),
        (this.remain = this.stat.size),
        (this.length = this.buf.length),
        this[writeEntryReadSymbol]();
    }
    [writeEntryReadSymbol]() {
      let {
        fd: writeEntryReadFd,
        buf: writeEntryReadBuffer,
        offset: writeEntryReadOffset,
        length: writeEntryReadLength,
        pos: writeEntryReadPosition,
      } = this;
      if (writeEntryReadFd === void 0 || writeEntryReadBuffer === void 0)
        throw Error("cannot read file without first opening");
      writeEntryFs.read(
        writeEntryReadFd,
        writeEntryReadBuffer,
        writeEntryReadOffset,
        writeEntryReadLength,
        writeEntryReadPosition,
        (writeEntryReadError, writeEntryBytesRead) => {
          if (writeEntryReadError)
            return this[writeEntryCloseSymbol](() =>
              this.emit("error", writeEntryReadError),
            );
          this[writeEntryOnReadSymbol](writeEntryBytesRead);
        },
      );
    }
    [writeEntryCloseSymbol](writeEntryCloseCallback = () => {}) {
      this.fd !== void 0 &&
        writeEntryFs.close(this.fd, writeEntryCloseCallback);
    }
    [writeEntryOnReadSymbol](writeEntryReadBytes) {
      if (writeEntryReadBytes <= 0 && this.remain > 0) {
        let writeEntryUnexpectedEofError = Object.assign(
          Error("encountered unexpected EOF"),
          { path: this.absolute, syscall: "read", code: "EOF" },
        );
        return this[writeEntryCloseSymbol](() =>
          this.emit("error", writeEntryUnexpectedEofError),
        );
      }
      if (writeEntryReadBytes > this.remain) {
        let writeEntryExpectedEofError = Object.assign(
          Error("did not encounter expected EOF"),
          { path: this.absolute, syscall: "read", code: "EOF" },
        );
        return this[writeEntryCloseSymbol](() =>
          this.emit("error", writeEntryExpectedEofError),
        );
      }
      if (!this.buf) throw Error("should have created buffer prior to reading");
      if (writeEntryReadBytes === this.remain) {
        for (
          let writeEntryPaddingIndex = writeEntryReadBytes;
          writeEntryPaddingIndex < this.length &&
          writeEntryReadBytes < this.blockRemain;
          writeEntryPaddingIndex++
        )
          (this.buf[writeEntryPaddingIndex + this.offset] = 0),
            writeEntryReadBytes++,
            this.remain++;
      }
      let writeEntryReadChunk =
        this.offset === 0 && writeEntryReadBytes === this.buf.length
          ? this.buf
          : this.buf.subarray(this.offset, this.offset + writeEntryReadBytes);
      this.write(writeEntryReadChunk)
        ? this[ondrainSymbol]()
        : this[awaitDrainSymbol](() => this[ondrainSymbol]());
    }
    [awaitDrainSymbol](writeEntryDrainCallback) {
      this.once("drain", writeEntryDrainCallback);
    }
    write(
      writeEntryWriteChunk,
      writeEntryWriteEncoding,
      writeEntryWriteCallback,
    ) {
      if (
        (typeof writeEntryWriteEncoding == "function" &&
          ((writeEntryWriteCallback = writeEntryWriteEncoding),
          (writeEntryWriteEncoding = void 0)),
        typeof writeEntryWriteChunk == "string" &&
          (writeEntryWriteChunk = Buffer.from(
            writeEntryWriteChunk,
            typeof writeEntryWriteEncoding == "string"
              ? writeEntryWriteEncoding
              : "utf8",
          )),
        this.blockRemain < writeEntryWriteChunk.length)
      ) {
        let writeEntryOverrunError = Object.assign(
          Error("writing more data than expected"),
          { path: this.absolute },
        );
        return this.emit("error", writeEntryOverrunError);
      }
      return (
        (this.remain -= writeEntryWriteChunk.length),
        (this.blockRemain -= writeEntryWriteChunk.length),
        (this.pos += writeEntryWriteChunk.length),
        (this.offset += writeEntryWriteChunk.length),
        super.write(writeEntryWriteChunk, null, writeEntryWriteCallback)
      );
    }
    [ondrainSymbol]() {
      if (!this.remain)
        return (
          this.blockRemain && super.write(Buffer.alloc(this.blockRemain)),
          this[writeEntryCloseSymbol]((writeEntryCloseError) =>
            writeEntryCloseError
              ? this.emit("error", writeEntryCloseError)
              : this.end(),
          )
        );
      if (!this.buf) throw Error("buffer lost somehow in ONDRAIN");
      this.offset >= this.length &&
        ((this.buf = Buffer.allocUnsafe(
          Math.min(this.blockRemain, this.buf.length),
        )),
        (this.offset = 0)),
        (this.length = this.buf.length - this.offset),
        this[writeEntryReadSymbol]();
    }
  },
  WriteEntrySync = class extends WriteEntry {
    sync = true;
    [lstatSymbol]() {
      this[onlstatSymbol](writeEntryFs.lstatSync(this.absolute));
    }
    [symlinkSymbol]() {
      this[onreadlinkSymbol](writeEntryFs.readlinkSync(this.absolute));
    }
    [openfileSymbol]() {
      this[onopenfileSymbol](writeEntryFs.openSync(this.absolute, "r"));
    }
    [writeEntryReadSymbol]() {
      let writeEntrySyncReadPending = true;
      try {
        let {
          fd: writeEntrySyncReadFd,
          buf: writeEntrySyncReadBuffer,
          offset: writeEntrySyncReadOffset,
          length: writeEntrySyncReadLength,
          pos: writeEntrySyncReadPosition,
        } = this;
        if (
          writeEntrySyncReadFd === void 0 ||
          writeEntrySyncReadBuffer === void 0
        )
          throw Error("fd and buf must be set in READ method");
        let writeEntrySyncBytesRead = writeEntryFs.readSync(
          writeEntrySyncReadFd,
          writeEntrySyncReadBuffer,
          writeEntrySyncReadOffset,
          writeEntrySyncReadLength,
          writeEntrySyncReadPosition,
        );
        this[writeEntryOnReadSymbol](writeEntrySyncBytesRead),
          (writeEntrySyncReadPending = false);
      } finally {
        if (writeEntrySyncReadPending)
          try {
            this[writeEntryCloseSymbol](() => {});
          } catch {}
      }
    }
    [awaitDrainSymbol](writeEntrySyncDrainCallback) {
      writeEntrySyncDrainCallback();
    }
    [writeEntryCloseSymbol](writeEntrySyncCloseCallback = () => {}) {
      this.fd !== void 0 && writeEntryFs.closeSync(this.fd),
        writeEntrySyncCloseCallback();
    }
  },
  WriteEntryTar = class extends Minipass {
    blockLen = 0;
    blockRemain = 0;
    buf = 0;
    pos = 0;
    remain = 0;
    length = 0;
    preservePaths;
    portable;
    strict;
    noPax;
    noMtime;
    readEntry;
    type;
    prefix;
    path;
    mode;
    uid;
    gid;
    uname;
    gname;
    header;
    mtime;
    atime;
    ctime;
    linkpath;
    size;
    onWriteEntry;
    warn(
      writeEntryTarWarnCode,
      writeEntryTarWarnMessage,
      writeEntryTarWarnData = {},
    ) {
      return emitTarWarning(
        this,
        writeEntryTarWarnCode,
        writeEntryTarWarnMessage,
        writeEntryTarWarnData,
      );
    }
    constructor(writeEntryTarReadEntry, writeEntryTarRawOptions = {}) {
      let writeEntryTarOptions = normalizeTarOptions(writeEntryTarRawOptions);
      super(),
        (this.preservePaths = !!writeEntryTarOptions.preservePaths),
        (this.portable = !!writeEntryTarOptions.portable),
        (this.strict = !!writeEntryTarOptions.strict),
        (this.noPax = !!writeEntryTarOptions.noPax),
        (this.noMtime = !!writeEntryTarOptions.noMtime),
        (this.onWriteEntry = writeEntryTarOptions.onWriteEntry),
        (this.readEntry = writeEntryTarReadEntry);
      let { type: writeEntryTarType } = writeEntryTarReadEntry;
      if (writeEntryTarType === "Unsupported")
        throw Error("writing entry that should be ignored");
      (this.type = writeEntryTarType),
        this.type === "Directory" && this.portable && (this.noMtime = true),
        (this.prefix = writeEntryTarOptions.prefix),
        (this.path = normalizeTarPath(writeEntryTarReadEntry.path)),
        (this.mode =
          writeEntryTarReadEntry.mode !== void 0
            ? this[writeEntryModeSymbol](writeEntryTarReadEntry.mode)
            : void 0),
        (this.uid = this.portable ? void 0 : writeEntryTarReadEntry.uid),
        (this.gid = this.portable ? void 0 : writeEntryTarReadEntry.gid),
        (this.uname = this.portable ? void 0 : writeEntryTarReadEntry.uname),
        (this.gname = this.portable ? void 0 : writeEntryTarReadEntry.gname),
        (this.size = writeEntryTarReadEntry.size),
        (this.mtime = this.noMtime
          ? void 0
          : writeEntryTarOptions.mtime || writeEntryTarReadEntry.mtime),
        (this.atime = this.portable ? void 0 : writeEntryTarReadEntry.atime),
        (this.ctime = this.portable ? void 0 : writeEntryTarReadEntry.ctime),
        (this.linkpath =
          writeEntryTarReadEntry.linkpath !== void 0
            ? normalizeTarPath(writeEntryTarReadEntry.linkpath)
            : void 0),
        typeof writeEntryTarOptions.onwarn == "function" &&
          this.on("warn", writeEntryTarOptions.onwarn);
      let writeEntryTarStrippedRoot = false;
      if (!this.preservePaths) {
        let [writeEntryTarAbsoluteRoot, writeEntryTarRelativePath] =
          splitAbsolutePath(this.path);
        writeEntryTarAbsoluteRoot &&
          typeof writeEntryTarRelativePath == "string" &&
          ((this.path = writeEntryTarRelativePath),
          (writeEntryTarStrippedRoot = writeEntryTarAbsoluteRoot));
      }
      (this.remain = writeEntryTarReadEntry.size),
        (this.blockRemain = writeEntryTarReadEntry.startBlockSize),
        this.onWriteEntry?.(this),
        (this.header = new TarHeader({
          path: this[prefixSymbol](this.path),
          linkpath:
            this.type === "Link" && this.linkpath !== void 0
              ? this[prefixSymbol](this.linkpath)
              : this.linkpath,
          mode: this.mode,
          uid: this.portable ? void 0 : this.uid,
          gid: this.portable ? void 0 : this.gid,
          size: this.size,
          mtime: this.noMtime ? void 0 : this.mtime,
          type: this.type,
          uname: this.portable ? void 0 : this.uname,
          atime: this.portable ? void 0 : this.atime,
          ctime: this.portable ? void 0 : this.ctime,
        })),
        writeEntryTarStrippedRoot &&
          this.warn(
            "TAR_ENTRY_INFO",
            "stripping " + writeEntryTarStrippedRoot + " from absolute path",
            { entry: this, path: writeEntryTarStrippedRoot + this.path },
          ),
        this.header.encode() &&
          !this.noPax &&
          super.write(
            new PaxHeader({
              atime: this.portable ? void 0 : this.atime,
              ctime: this.portable ? void 0 : this.ctime,
              gid: this.portable ? void 0 : this.gid,
              mtime: this.noMtime ? void 0 : this.mtime,
              path: this[prefixSymbol](this.path),
              linkpath:
                this.type === "Link" && this.linkpath !== void 0
                  ? this[prefixSymbol](this.linkpath)
                  : this.linkpath,
              size: this.size,
              uid: this.portable ? void 0 : this.uid,
              uname: this.portable ? void 0 : this.uname,
              dev: this.portable ? void 0 : this.readEntry.dev,
              ino: this.portable ? void 0 : this.readEntry.ino,
              nlink: this.portable ? void 0 : this.readEntry.nlink,
            }).encode(),
          );
      let writeEntryTarHeaderBlock = this.header?.block;
      if (!writeEntryTarHeaderBlock) throw Error("failed to encode header");
      super.write(writeEntryTarHeaderBlock), writeEntryTarReadEntry.pipe(this);
    }
    [prefixSymbol](writeEntryTarPrefixPath) {
      return applyTarPrefix(writeEntryTarPrefixPath, this.prefix);
    }
    [writeEntryModeSymbol](writeEntryTarMode) {
      return normalizeTarMode(
        writeEntryTarMode,
        this.type === "Directory",
        this.portable,
      );
    }
    write(
      writeEntryTarWriteChunk,
      writeEntryTarWriteEncoding,
      writeEntryTarWriteCallback,
    ) {
      typeof writeEntryTarWriteEncoding == "function" &&
        ((writeEntryTarWriteCallback = writeEntryTarWriteEncoding),
        (writeEntryTarWriteEncoding = void 0)),
        typeof writeEntryTarWriteChunk == "string" &&
          (writeEntryTarWriteChunk = Buffer.from(
            writeEntryTarWriteChunk,
            typeof writeEntryTarWriteEncoding == "string"
              ? writeEntryTarWriteEncoding
              : "utf8",
          ));
      let writeEntryTarWriteLength = writeEntryTarWriteChunk.length;
      if (writeEntryTarWriteLength > this.blockRemain)
        throw Error("writing more to entry than is appropriate");
      return (
        (this.blockRemain -= writeEntryTarWriteLength),
        super.write(writeEntryTarWriteChunk, writeEntryTarWriteCallback)
      );
    }
    end(
      writeEntryTarEndChunk,
      writeEntryTarEndEncoding,
      writeEntryTarEndCallback,
    ) {
      return (
        this.blockRemain && super.write(Buffer.alloc(this.blockRemain)),
        typeof writeEntryTarEndChunk == "function" &&
          ((writeEntryTarEndCallback = writeEntryTarEndChunk),
          (writeEntryTarEndEncoding = void 0),
          (writeEntryTarEndChunk = void 0)),
        typeof writeEntryTarEndEncoding == "function" &&
          ((writeEntryTarEndCallback = writeEntryTarEndEncoding),
          (writeEntryTarEndEncoding = void 0)),
        typeof writeEntryTarEndChunk == "string" &&
          (writeEntryTarEndChunk = Buffer.from(
            writeEntryTarEndChunk,
            writeEntryTarEndEncoding ?? "utf8",
          )),
        writeEntryTarEndCallback &&
          this.once("finish", writeEntryTarEndCallback),
        writeEntryTarEndChunk
          ? super.end(writeEntryTarEndChunk, writeEntryTarEndCallback)
          : super.end(writeEntryTarEndCallback),
        this
      );
    }
  },
  getTarType = (tarTypeStat) =>
    tarTypeStat.isFile()
      ? "File"
      : tarTypeStat.isDirectory()
        ? "Directory"
        : tarTypeStat.isSymbolicLink()
          ? "SymbolicLink"
          : "Unsupported",
  Yallist = class {
    tail;
    head;
    length = 0;
    static create(yallistCreateValues = []) {
      return new Yallist(yallistCreateValues);
    }
    constructor(yallistInitialValues = []) {
      for (let yallistInitialValue of yallistInitialValues)
        this.push(yallistInitialValue);
    }
    *[Symbol.iterator]() {
      for (
        let yallistIteratorNode = this.head;
        yallistIteratorNode;
        yallistIteratorNode = yallistIteratorNode.next
      )
        yield yallistIteratorNode.value;
    }
    removeNode(yallistRemoveNode) {
      if (yallistRemoveNode.list !== this)
        throw Error("removing node which does not belong to this list");
      let { next: yallistNextNode, prev: yallistPrevNode } = yallistRemoveNode;
      return (
        yallistNextNode && (yallistNextNode.prev = yallistPrevNode),
        yallistPrevNode && (yallistPrevNode.next = yallistNextNode),
        yallistRemoveNode === this.head && (this.head = yallistNextNode),
        yallistRemoveNode === this.tail && (this.tail = yallistPrevNode),
        this.length--,
        (yallistRemoveNode.next = void 0),
        (yallistRemoveNode.prev = void 0),
        (yallistRemoveNode.list = void 0),
        yallistNextNode
      );
    }
    unshiftNode(yallistUnshiftNode) {
      if (yallistUnshiftNode === this.head) return;
      yallistUnshiftNode.list &&
        yallistUnshiftNode.list.removeNode(yallistUnshiftNode);
      let yallistOldHead = this.head;
      (yallistUnshiftNode.list = this),
        (yallistUnshiftNode.next = yallistOldHead),
        yallistOldHead && (yallistOldHead.prev = yallistUnshiftNode),
        (this.head = yallistUnshiftNode),
        this.tail || (this.tail = yallistUnshiftNode),
        this.length++;
    }
    pushNode(yallistPushNode) {
      if (yallistPushNode === this.tail) return;
      yallistPushNode.list && yallistPushNode.list.removeNode(yallistPushNode);
      let yallistOldTail = this.tail;
      (yallistPushNode.list = this),
        (yallistPushNode.prev = yallistOldTail),
        yallistOldTail && (yallistOldTail.next = yallistPushNode),
        (this.tail = yallistPushNode),
        this.head || (this.head = yallistPushNode),
        this.length++;
    }
    push(...yallistPushValues) {
      for (
        let yallistPushIndex = 0, yallistPushCount = yallistPushValues.length;
        yallistPushIndex < yallistPushCount;
        yallistPushIndex++
      )
        pushYallistValue(this, yallistPushValues[yallistPushIndex]);
      return this.length;
    }
    unshift(...yallistUnshiftValues) {
      for (
        var yallistUnshiftIndex = 0,
          yallistUnshiftCount = yallistUnshiftValues.length;
        yallistUnshiftIndex < yallistUnshiftCount;
        yallistUnshiftIndex++
      )
        unshiftYallistValue(this, yallistUnshiftValues[yallistUnshiftIndex]);
      return this.length;
    }
    pop() {
      if (!this.tail) return;
      let yallistPoppedValue = this.tail.value,
        yallistPoppedNode = this.tail;
      return (
        (this.tail = this.tail.prev),
        this.tail ? (this.tail.next = void 0) : (this.head = void 0),
        (yallistPoppedNode.list = void 0),
        this.length--,
        yallistPoppedValue
      );
    }
    shift() {
      if (!this.head) return;
      let yallistShiftedValue = this.head.value,
        yallistShiftedNode = this.head;
      return (
        (this.head = this.head.next),
        this.head ? (this.head.prev = void 0) : (this.tail = void 0),
        (yallistShiftedNode.list = void 0),
        this.length--,
        yallistShiftedValue
      );
    }
    forEach(yallistForEachCallback, yallistForEachThisArg) {
      yallistForEachThisArg = yallistForEachThisArg || this;
      for (
        let yallistForEachNode = this.head, yallistForEachIndex = 0;
        yallistForEachNode;
        yallistForEachIndex++
      )
        yallistForEachCallback.call(
          yallistForEachThisArg,
          yallistForEachNode.value,
          yallistForEachIndex,
          this,
        ),
          (yallistForEachNode = yallistForEachNode.next);
    }
    forEachReverse(
      yallistForEachReverseCallback,
      yallistForEachReverseThisArg,
    ) {
      yallistForEachReverseThisArg = yallistForEachReverseThisArg || this;
      for (
        let yallistForEachReverseNode = this.tail,
          yallistForEachReverseIndex = this.length - 1;
        yallistForEachReverseNode;
        yallistForEachReverseIndex--
      )
        yallistForEachReverseCallback.call(
          yallistForEachReverseThisArg,
          yallistForEachReverseNode.value,
          yallistForEachReverseIndex,
          this,
        ),
          (yallistForEachReverseNode = yallistForEachReverseNode.prev);
    }
    get(yallistGetIndex) {
      let yallistGetCursor = 0,
        yallistGetNode = this.head;
      for (
        ;
        yallistGetNode && yallistGetCursor < yallistGetIndex;
        yallistGetCursor++
      )
        yallistGetNode = yallistGetNode.next;
      if (yallistGetCursor === yallistGetIndex && yallistGetNode)
        return yallistGetNode.value;
    }
    getReverse(yallistGetReverseIndex) {
      let yallistGetReverseCursor = 0,
        yallistGetReverseNode = this.tail;
      for (
        ;
        yallistGetReverseNode &&
        yallistGetReverseCursor < yallistGetReverseIndex;
        yallistGetReverseCursor++
      )
        yallistGetReverseNode = yallistGetReverseNode.prev;
      if (
        yallistGetReverseCursor === yallistGetReverseIndex &&
        yallistGetReverseNode
      )
        return yallistGetReverseNode.value;
    }
    map(yallistMapCallback, yallistMapThisArg) {
      yallistMapThisArg = yallistMapThisArg || this;
      let yallistMappedList = new Yallist();
      for (let yallistMapNode = this.head; yallistMapNode; )
        yallistMappedList.push(
          yallistMapCallback.call(
            yallistMapThisArg,
            yallistMapNode.value,
            this,
          ),
        ),
          (yallistMapNode = yallistMapNode.next);
      return yallistMappedList;
    }
    mapReverse(yallistMapReverseCallback, yallistMapReverseThisArg) {
      yallistMapReverseThisArg = yallistMapReverseThisArg || this;
      var yallistReverseMappedList = new Yallist();
      for (let yallistMapReverseNode = this.tail; yallistMapReverseNode; )
        yallistReverseMappedList.push(
          yallistMapReverseCallback.call(
            yallistMapReverseThisArg,
            yallistMapReverseNode.value,
            this,
          ),
        ),
          (yallistMapReverseNode = yallistMapReverseNode.prev);
      return yallistReverseMappedList;
    }
    reduce(yallistReduceCallback, yallistReduceInitialValue) {
      let yallistReduceAccumulator,
        yallistReduceNode = this.head;
      if (arguments.length > 1)
        yallistReduceAccumulator = yallistReduceInitialValue;
      else {
        if (this.head)
          (yallistReduceNode = this.head.next),
            (yallistReduceAccumulator = this.head.value);
        else throw TypeError("Reduce of empty list with no initial value");
      }
      for (var yallistReduceIndex = 0; yallistReduceNode; yallistReduceIndex++)
        (yallistReduceAccumulator = yallistReduceCallback(
          yallistReduceAccumulator,
          yallistReduceNode.value,
          yallistReduceIndex,
        )),
          (yallistReduceNode = yallistReduceNode.next);
      return yallistReduceAccumulator;
    }
    reduceReverse(
      yallistReduceReverseCallback,
      yallistReduceReverseInitialValue,
    ) {
      let yallistReduceReverseAccumulator,
        yallistReduceReverseNode = this.tail;
      if (arguments.length > 1)
        yallistReduceReverseAccumulator = yallistReduceReverseInitialValue;
      else {
        if (this.tail)
          (yallistReduceReverseNode = this.tail.prev),
            (yallistReduceReverseAccumulator = this.tail.value);
        else throw TypeError("Reduce of empty list with no initial value");
      }
      for (
        let yallistReduceReverseIndex = this.length - 1;
        yallistReduceReverseNode;
        yallistReduceReverseIndex--
      )
        (yallistReduceReverseAccumulator = yallistReduceReverseCallback(
          yallistReduceReverseAccumulator,
          yallistReduceReverseNode.value,
          yallistReduceReverseIndex,
        )),
          (yallistReduceReverseNode = yallistReduceReverseNode.prev);
      return yallistReduceReverseAccumulator;
    }
    toArray() {
      let yallistArray = Array(this.length);
      for (
        let yallistArrayIndex = 0, yallistArrayNode = this.head;
        yallistArrayNode;
        yallistArrayIndex++
      )
        (yallistArray[yallistArrayIndex] = yallistArrayNode.value),
          (yallistArrayNode = yallistArrayNode.next);
      return yallistArray;
    }
    toArrayReverse() {
      let yallistReverseArray = Array(this.length);
      for (
        let yallistReverseArrayIndex = 0, yallistReverseArrayNode = this.tail;
        yallistReverseArrayNode;
        yallistReverseArrayIndex++
      )
        (yallistReverseArray[yallistReverseArrayIndex] =
          yallistReverseArrayNode.value),
          (yallistReverseArrayNode = yallistReverseArrayNode.prev);
      return yallistReverseArray;
    }
    slice(yallistSliceFrom = 0, yallistSliceTo = this.length) {
      yallistSliceTo < 0 && (yallistSliceTo += this.length),
        yallistSliceFrom < 0 && (yallistSliceFrom += this.length);
      let yallistSliceList = new Yallist();
      if (yallistSliceTo < yallistSliceFrom || yallistSliceTo < 0)
        return yallistSliceList;
      yallistSliceFrom < 0 && (yallistSliceFrom = 0),
        yallistSliceTo > this.length && (yallistSliceTo = this.length);
      let yallistSliceNode = this.head,
        yallistSliceIndex = 0;
      for (
        yallistSliceIndex = 0;
        yallistSliceNode && yallistSliceIndex < yallistSliceFrom;
        yallistSliceIndex++
      )
        yallistSliceNode = yallistSliceNode.next;
      for (
        ;
        yallistSliceNode && yallistSliceIndex < yallistSliceTo;
        yallistSliceIndex++, yallistSliceNode = yallistSliceNode.next
      )
        yallistSliceList.push(yallistSliceNode.value);
      return yallistSliceList;
    }
    sliceReverse(
      yallistSliceReverseFrom = 0,
      yallistSliceReverseTo = this.length,
    ) {
      yallistSliceReverseTo < 0 && (yallistSliceReverseTo += this.length),
        yallistSliceReverseFrom < 0 && (yallistSliceReverseFrom += this.length);
      let yallistSliceReverseList = new Yallist();
      if (
        yallistSliceReverseTo < yallistSliceReverseFrom ||
        yallistSliceReverseTo < 0
      )
        return yallistSliceReverseList;
      yallistSliceReverseFrom < 0 && (yallistSliceReverseFrom = 0),
        yallistSliceReverseTo > this.length &&
          (yallistSliceReverseTo = this.length);
      let yallistSliceReverseIndex = this.length,
        yallistSliceReverseNode = this.tail;
      for (
        ;
        yallistSliceReverseNode &&
        yallistSliceReverseIndex > yallistSliceReverseTo;
        yallistSliceReverseIndex--
      )
        yallistSliceReverseNode = yallistSliceReverseNode.prev;
      for (
        ;
        yallistSliceReverseNode &&
        yallistSliceReverseIndex > yallistSliceReverseFrom;
        yallistSliceReverseIndex--,
          yallistSliceReverseNode = yallistSliceReverseNode.prev
      )
        yallistSliceReverseList.push(yallistSliceReverseNode.value);
      return yallistSliceReverseList;
    }
    splice(
      yallistSpliceStart,
      yallistSpliceDeleteCount = 0,
      ...yallistSpliceInsertValues
    ) {
      yallistSpliceStart > this.length &&
        (yallistSpliceStart = this.length - 1),
        yallistSpliceStart < 0 &&
          (yallistSpliceStart = this.length + yallistSpliceStart);
      let yallistSpliceNode = this.head;
      for (
        let yallistSpliceFindIndex = 0;
        yallistSpliceNode && yallistSpliceFindIndex < yallistSpliceStart;
        yallistSpliceFindIndex++
      )
        yallistSpliceNode = yallistSpliceNode.next;
      let yallistSpliceRemovedValues = [];
      for (
        let yallistSpliceRemoveIndex = 0;
        yallistSpliceNode &&
        yallistSpliceRemoveIndex < yallistSpliceDeleteCount;
        yallistSpliceRemoveIndex++
      )
        yallistSpliceRemovedValues.push(yallistSpliceNode.value),
          (yallistSpliceNode = this.removeNode(yallistSpliceNode));
      yallistSpliceNode
        ? yallistSpliceNode !== this.tail &&
          (yallistSpliceNode = yallistSpliceNode.prev)
        : (yallistSpliceNode = this.tail);
      for (let yallistSpliceInsertValue of yallistSpliceInsertValues)
        yallistSpliceNode = insertYallistNodeAfter(
          this,
          yallistSpliceNode,
          yallistSpliceInsertValue,
        );
      return yallistSpliceRemovedValues;
    }
    reverse() {
      let yallistOriginalHead = this.head,
        yallistOriginalTail = this.tail;
      for (
        let yallistReverseNode = yallistOriginalHead;
        yallistReverseNode;
        yallistReverseNode = yallistReverseNode.prev
      ) {
        let yallistReversePrev = yallistReverseNode.prev;
        (yallistReverseNode.prev = yallistReverseNode.next),
          (yallistReverseNode.next = yallistReversePrev);
      }
      return (
        (this.head = yallistOriginalTail),
        (this.tail = yallistOriginalHead),
        this
      );
    }
  };
function insertYallistNodeAfter(
  yallistTargetList,
  yallistInsertAfterNode,
  yallistInsertValue,
) {
  let yallistInsertPrevNode = yallistInsertAfterNode,
    yallistInsertNextNode = yallistInsertAfterNode
      ? yallistInsertAfterNode.next
      : yallistTargetList.head,
    yallistInsertedNode = new YallistNode(
      yallistInsertValue,
      yallistInsertPrevNode,
      yallistInsertNextNode,
      yallistTargetList,
    );
  return (
    yallistInsertedNode.next === void 0 &&
      (yallistTargetList.tail = yallistInsertedNode),
    yallistInsertedNode.prev === void 0 &&
      (yallistTargetList.head = yallistInsertedNode),
    yallistTargetList.length++,
    yallistInsertedNode
  );
}
function pushYallistValue(yallistPushTarget, yallistPushValue) {
  (yallistPushTarget.tail = new YallistNode(
    yallistPushValue,
    yallistPushTarget.tail,
    void 0,
    yallistPushTarget,
  )),
    yallistPushTarget.head || (yallistPushTarget.head = yallistPushTarget.tail),
    yallistPushTarget.length++;
}
function unshiftYallistValue(yallistUnshiftTarget, yallistUnshiftValue) {
  (yallistUnshiftTarget.head = new YallistNode(
    yallistUnshiftValue,
    void 0,
    yallistUnshiftTarget.head,
    yallistUnshiftTarget,
  )),
    yallistUnshiftTarget.tail ||
      (yallistUnshiftTarget.tail = yallistUnshiftTarget.head),
    yallistUnshiftTarget.length++;
}
var YallistNode = class {
    list;
    next;
    prev;
    value;
    constructor(
      yallistNodeValue,
      yallistNodePrev,
      yallistNodeNext,
      yallistNodeList,
    ) {
      (this.list = yallistNodeList),
        (this.value = yallistNodeValue),
        yallistNodePrev
          ? ((yallistNodePrev.next = this), (this.prev = yallistNodePrev))
          : (this.prev = void 0),
        yallistNodeNext
          ? ((yallistNodeNext.prev = this), (this.next = yallistNodeNext))
          : (this.next = void 0);
    }
  },
  PackJob = class {
    path;
    absolute;
    entry;
    stat;
    readdir;
    pending = false;
    ignore = false;
    piped = false;
    constructor(packJobPath, packJobAbsolutePath) {
      (this.path = packJobPath || "./"), (this.absolute = packJobAbsolutePath);
    }
  },
  tarEndPaddingBlock = Buffer.alloc(1024),
  onStatSymbol = Symbol("onStat"),
  packEndedSymbol = Symbol("ended"),
  packQueueSymbol = Symbol("queue"),
  currentSymbol = Symbol("current"),
  packProcessSymbol = Symbol("process"),
  processingSymbol = Symbol("processing"),
  processJobSymbol = Symbol("processJob"),
  jobsSymbol = Symbol("jobs"),
  jobDoneSymbol = Symbol("jobDone"),
  addFSEntrySymbol = Symbol("addFSEntry"),
  addTarEntrySymbol = Symbol("addTarEntry"),
  statSymbol = Symbol("stat"),
  readdirSymbol = Symbol("readdir"),
  onreaddirSymbol = Symbol("onreaddir"),
  pipeSymbol = Symbol("pipe"),
  entrySymbol = Symbol("entry"),
  entryOptSymbol = Symbol("entryOpt"),
  writeEntryClassSymbol = Symbol("writeEntryClass"),
  packRawWriteSymbol = Symbol("write"),
  packOnDrainSymbol = Symbol("ondrain"),
  Pack = class extends Minipass {
    sync = false;
    opt;
    cwd;
    maxReadSize;
    preservePaths;
    strict;
    noPax;
    prefix;
    linkCache;
    statCache;
    file;
    portable;
    zip;
    readdirCache;
    noDirRecurse;
    follow;
    noMtime;
    mtime;
    filter;
    jobs;
    [writeEntryClassSymbol];
    onWriteEntry;
    [packQueueSymbol];
    [jobsSymbol] = 0;
    [processingSymbol] = false;
    [packEndedSymbol] = false;
    constructor(tarPackOptions = {}) {
      if (
        (super(),
        (this.opt = tarPackOptions),
        (this.file = tarPackOptions.file || ""),
        (this.cwd = tarPackOptions.cwd || process.cwd()),
        (this.maxReadSize = tarPackOptions.maxReadSize),
        (this.preservePaths = !!tarPackOptions.preservePaths),
        (this.strict = !!tarPackOptions.strict),
        (this.noPax = !!tarPackOptions.noPax),
        (this.prefix = normalizeTarPath(tarPackOptions.prefix || "")),
        (this.linkCache = tarPackOptions.linkCache || new Map()),
        (this.statCache = tarPackOptions.statCache || new Map()),
        (this.readdirCache = tarPackOptions.readdirCache || new Map()),
        (this.onWriteEntry = tarPackOptions.onWriteEntry),
        (this[writeEntryClassSymbol] = WriteEntry),
        typeof tarPackOptions.onwarn == "function" &&
          this.on("warn", tarPackOptions.onwarn),
        (this.portable = !!tarPackOptions.portable),
        tarPackOptions.gzip || tarPackOptions.brotli || tarPackOptions.zstd)
      ) {
        if (
          (tarPackOptions.gzip ? 1 : 0) +
            (tarPackOptions.brotli ? 1 : 0) +
            (tarPackOptions.zstd ? 1 : 0) >
          1
        )
          throw TypeError("gzip, brotli, zstd are mutually exclusive");
        if (
          (tarPackOptions.gzip &&
            (typeof tarPackOptions.gzip != "object" &&
              (tarPackOptions.gzip = {}),
            this.portable && (tarPackOptions.gzip.portable = true),
            (this.zip = new Gzip(tarPackOptions.gzip))),
          tarPackOptions.brotli &&
            (typeof tarPackOptions.brotli != "object" &&
              (tarPackOptions.brotli = {}),
            (this.zip = new BrotliCompress(tarPackOptions.brotli))),
          tarPackOptions.zstd &&
            (typeof tarPackOptions.zstd != "object" &&
              (tarPackOptions.zstd = {}),
            (this.zip = new ZstdCompress(tarPackOptions.zstd))),
          !this.zip)
        )
          throw Error("impossible");
        let tarPackCompressionStream = this.zip;
        tarPackCompressionStream.on("data", (tarPackCompressedChunk) =>
          super.write(tarPackCompressedChunk),
        ),
          tarPackCompressionStream.on("end", () => super.end()),
          tarPackCompressionStream.on("drain", () => this[packOnDrainSymbol]()),
          this.on("resume", () => tarPackCompressionStream.resume());
      } else this.on("drain", this[packOnDrainSymbol]);
      (this.noDirRecurse = !!tarPackOptions.noDirRecurse),
        (this.follow = !!tarPackOptions.follow),
        (this.noMtime = !!tarPackOptions.noMtime),
        tarPackOptions.mtime && (this.mtime = tarPackOptions.mtime),
        (this.filter =
          typeof tarPackOptions.filter == "function"
            ? tarPackOptions.filter
            : () => true),
        (this[packQueueSymbol] = new Yallist()),
        (this[jobsSymbol] = 0),
        (this.jobs = Number(tarPackOptions.jobs) || 4),
        (this[processingSymbol] = false),
        (this[packEndedSymbol] = false);
    }
    [packRawWriteSymbol](tarPackRawChunk) {
      return super.write(tarPackRawChunk);
    }
    add(tarPackAddPath) {
      return this.write(tarPackAddPath), this;
    }
    end(tarPackEndEntry, tarPackEndEncoding, tarPackEndCallback) {
      return (
        typeof tarPackEndEntry == "function" &&
          ((tarPackEndCallback = tarPackEndEntry), (tarPackEndEntry = void 0)),
        typeof tarPackEndEncoding == "function" &&
          ((tarPackEndCallback = tarPackEndEncoding),
          (tarPackEndEncoding = void 0)),
        tarPackEndEntry && this.add(tarPackEndEntry),
        (this[packEndedSymbol] = true),
        this[packProcessSymbol](),
        tarPackEndCallback && tarPackEndCallback(),
        this
      );
    }
    write(tarPackWriteInput) {
      if (this[packEndedSymbol]) throw Error("write after end");
      return (
        tarPackWriteInput instanceof ReadEntry
          ? this[addTarEntrySymbol](tarPackWriteInput)
          : this[addFSEntrySymbol](tarPackWriteInput),
        this.flowing
      );
    }
    [addTarEntrySymbol](tarPackReadEntry) {
      let tarPackReadEntryAbsolute = normalizeTarPath(
        packPath.resolve(this.cwd, tarPackReadEntry.path),
      );
      if (!this.filter(tarPackReadEntry.path, tarPackReadEntry))
        tarPackReadEntry.resume();
      else {
        let tarPackReadEntryJob = new PackJob(
          tarPackReadEntry.path,
          tarPackReadEntryAbsolute,
        );
        (tarPackReadEntryJob.entry = new WriteEntryTar(
          tarPackReadEntry,
          this[entryOptSymbol](tarPackReadEntryJob),
        )),
          tarPackReadEntryJob.entry.on("end", () =>
            this[jobDoneSymbol](tarPackReadEntryJob),
          ),
          (this[jobsSymbol] += 1),
          this[packQueueSymbol].push(tarPackReadEntryJob);
      }
      this[packProcessSymbol]();
    }
    [addFSEntrySymbol](tarPackFsPath) {
      let tarPackFsAbsolute = normalizeTarPath(
        packPath.resolve(this.cwd, tarPackFsPath),
      );
      this[packQueueSymbol].push(new PackJob(tarPackFsPath, tarPackFsAbsolute)),
        this[packProcessSymbol]();
    }
    [statSymbol](tarPackStatJob) {
      (tarPackStatJob.pending = true), (this[jobsSymbol] += 1);
      let tarPackStatMethod = this.follow ? "stat" : "lstat";
      packFs[tarPackStatMethod](
        tarPackStatJob.absolute,
        (tarPackStatError, tarPackStatResult) => {
          (tarPackStatJob.pending = false),
            (this[jobsSymbol] -= 1),
            tarPackStatError
              ? this.emit("error", tarPackStatError)
              : this[onStatSymbol](tarPackStatJob, tarPackStatResult);
        },
      );
    }
    [onStatSymbol](tarPackStatResultJob, tarPackEntryStat) {
      this.statCache.set(tarPackStatResultJob.absolute, tarPackEntryStat),
        (tarPackStatResultJob.stat = tarPackEntryStat),
        this.filter(tarPackStatResultJob.path, tarPackEntryStat)
          ? tarPackEntryStat.isFile() &&
            tarPackEntryStat.nlink > 1 &&
            tarPackStatResultJob === this[currentSymbol] &&
            !this.linkCache.get(
              tarPackEntryStat.dev + ":" + tarPackEntryStat.ino,
            ) &&
            !this.sync &&
            this[processJobSymbol](tarPackStatResultJob)
          : (tarPackStatResultJob.ignore = true),
        this[packProcessSymbol]();
    }
    [readdirSymbol](tarPackReaddirJob) {
      (tarPackReaddirJob.pending = true),
        (this[jobsSymbol] += 1),
        packFs.readdir(
          tarPackReaddirJob.absolute,
          (tarPackReaddirError, tarPackReaddirEntries) => {
            if (
              ((tarPackReaddirJob.pending = false),
              (this[jobsSymbol] -= 1),
              tarPackReaddirError)
            )
              return this.emit("error", tarPackReaddirError);
            this[onreaddirSymbol](tarPackReaddirJob, tarPackReaddirEntries);
          },
        );
    }
    [onreaddirSymbol](tarPackReaddirResultJob, tarPackDirectoryEntries) {
      this.readdirCache.set(
        tarPackReaddirResultJob.absolute,
        tarPackDirectoryEntries,
      ),
        (tarPackReaddirResultJob.readdir = tarPackDirectoryEntries),
        this[packProcessSymbol]();
    }
    [packProcessSymbol]() {
      if (!this[processingSymbol]) {
        this[processingSymbol] = true;
        for (
          let tarPackQueueNode = this[packQueueSymbol].head;
          tarPackQueueNode && this[jobsSymbol] < this.jobs;
          tarPackQueueNode = tarPackQueueNode.next
        )
          if (
            (this[processJobSymbol](tarPackQueueNode.value),
            tarPackQueueNode.value.ignore)
          ) {
            let nextTarPackQueueNode = tarPackQueueNode.next;
            this[packQueueSymbol].removeNode(tarPackQueueNode),
              (tarPackQueueNode.next = nextTarPackQueueNode);
          }
        (this[processingSymbol] = false),
          this[packEndedSymbol] &&
            this[packQueueSymbol].length === 0 &&
            this[jobsSymbol] === 0 &&
            (this.zip
              ? this.zip.end(tarEndPaddingBlock)
              : (super.write(tarEndPaddingBlock), super.end()));
      }
    }
    get [currentSymbol]() {
      return (
        this[packQueueSymbol] &&
        this[packQueueSymbol].head &&
        this[packQueueSymbol].head.value
      );
    }
    [jobDoneSymbol](completedTarPackJob) {
      this[packQueueSymbol].shift(),
        (this[jobsSymbol] -= 1),
        this[packProcessSymbol]();
    }
    [processJobSymbol](tarPackJobToProcess) {
      if (!tarPackJobToProcess.pending) {
        if (tarPackJobToProcess.entry) {
          tarPackJobToProcess === this[currentSymbol] &&
            !tarPackJobToProcess.piped &&
            this[pipeSymbol](tarPackJobToProcess);
          return;
        }
        if (!tarPackJobToProcess.stat) {
          let cachedTarPackStat = this.statCache.get(
            tarPackJobToProcess.absolute,
          );
          cachedTarPackStat
            ? this[onStatSymbol](tarPackJobToProcess, cachedTarPackStat)
            : this[statSymbol](tarPackJobToProcess);
        }
        if (tarPackJobToProcess.stat && !tarPackJobToProcess.ignore) {
          if (
            !this.noDirRecurse &&
            tarPackJobToProcess.stat.isDirectory() &&
            !tarPackJobToProcess.readdir
          ) {
            let cachedTarPackReaddir = this.readdirCache.get(
              tarPackJobToProcess.absolute,
            );
            if (
              (cachedTarPackReaddir
                ? this[onreaddirSymbol](
                    tarPackJobToProcess,
                    cachedTarPackReaddir,
                  )
                : this[readdirSymbol](tarPackJobToProcess),
              !tarPackJobToProcess.readdir)
            )
              return;
          }
          if (
            ((tarPackJobToProcess.entry =
              this[entrySymbol](tarPackJobToProcess)),
            !tarPackJobToProcess.entry)
          ) {
            tarPackJobToProcess.ignore = true;
            return;
          }
          tarPackJobToProcess === this[currentSymbol] &&
            !tarPackJobToProcess.piped &&
            this[pipeSymbol](tarPackJobToProcess);
        }
      }
    }
    [entryOptSymbol](tarPackEntryJob) {
      return {
        onwarn: (tarPackWarnCode, tarPackWarnMessage, tarPackWarnData) =>
          this.warn(tarPackWarnCode, tarPackWarnMessage, tarPackWarnData),
        noPax: this.noPax,
        cwd: this.cwd,
        absolute: tarPackEntryJob.absolute,
        preservePaths: this.preservePaths,
        maxReadSize: this.maxReadSize,
        strict: this.strict,
        portable: this.portable,
        linkCache: this.linkCache,
        statCache: this.statCache,
        noMtime: this.noMtime,
        mtime: this.mtime,
        prefix: this.prefix,
        onWriteEntry: this.onWriteEntry,
      };
    }
    [entrySymbol](tarPackEntrySourceJob) {
      this[jobsSymbol] += 1;
      try {
        return new this[writeEntryClassSymbol](
          tarPackEntrySourceJob.path,
          this[entryOptSymbol](tarPackEntrySourceJob),
        )
          .on("end", () => this[jobDoneSymbol](tarPackEntrySourceJob))
          .on("error", (tarPackEntryError) =>
            this.emit("error", tarPackEntryError),
          );
      } catch (tarPackEntryCreateError) {
        this.emit("error", tarPackEntryCreateError);
      }
    }
    [packOnDrainSymbol]() {
      this[currentSymbol] &&
        this[currentSymbol].entry &&
        this[currentSymbol].entry.resume();
    }
    [pipeSymbol](tarPackPipeJob) {
      (tarPackPipeJob.piped = true),
        tarPackPipeJob.readdir &&
          tarPackPipeJob.readdir.forEach((tarPackDirectoryChild) => {
            let tarPackDirectoryPath = tarPackPipeJob.path,
              tarPackDirectoryPrefix =
                tarPackDirectoryPath === "./"
                  ? ""
                  : tarPackDirectoryPath.replace(/\/*$/, "/");
            this[addFSEntrySymbol](
              tarPackDirectoryPrefix + tarPackDirectoryChild,
            );
          });
      let tarPackEntryStream = tarPackPipeJob.entry,
        tarPackZipStream = this.zip;
      if (!tarPackEntryStream) throw Error("cannot pipe without source");
      tarPackZipStream
        ? tarPackEntryStream.on("data", (tarPackEntryCompressedData) => {
            tarPackZipStream.write(tarPackEntryCompressedData) ||
              tarPackEntryStream.pause();
          })
        : tarPackEntryStream.on("data", (tarPackEntryRawData) => {
            super.write(tarPackEntryRawData) || tarPackEntryStream.pause();
          });
    }
    pause() {
      return this.zip && this.zip.pause(), super.pause();
    }
    warn(tarPackWarningCode, tarPackWarningMessage, tarPackWarningData = {}) {
      emitTarWarning(
        this,
        tarPackWarningCode,
        tarPackWarningMessage,
        tarPackWarningData,
      );
    }
  },
  PackSync = class extends Pack {
    sync = true;
    constructor(tarPackSyncOptions) {
      super(tarPackSyncOptions), (this[writeEntryClassSymbol] = WriteEntrySync);
    }
    pause() {}
    resume() {}
    [statSymbol](tarPackSyncStatJob) {
      let tarPackSyncStatMethod = this.follow ? "statSync" : "lstatSync";
      this[onStatSymbol](
        tarPackSyncStatJob,
        packFs[tarPackSyncStatMethod](tarPackSyncStatJob.absolute),
      );
    }
    [readdirSymbol](tarPackSyncReaddirJob) {
      this[onreaddirSymbol](
        tarPackSyncReaddirJob,
        packFs.readdirSync(tarPackSyncReaddirJob.absolute),
      );
    }
    [pipeSymbol](tarPackSyncPipeJob) {
      let tarPackSyncEntryStream = tarPackSyncPipeJob.entry,
        tarPackSyncZipStream = this.zip;
      if (
        (tarPackSyncPipeJob.readdir &&
          tarPackSyncPipeJob.readdir.forEach((tarPackSyncDirectoryChild) => {
            let tarPackSyncDirectoryPath = tarPackSyncPipeJob.path,
              tarPackSyncDirectoryPrefix =
                tarPackSyncDirectoryPath === "./"
                  ? ""
                  : tarPackSyncDirectoryPath.replace(/\/*$/, "/");
            this[addFSEntrySymbol](
              tarPackSyncDirectoryPrefix + tarPackSyncDirectoryChild,
            );
          }),
        !tarPackSyncEntryStream)
      )
        throw Error("Cannot pipe without source");
      tarPackSyncZipStream
        ? tarPackSyncEntryStream.on("data", (tarPackSyncCompressedData) => {
            tarPackSyncZipStream.write(tarPackSyncCompressedData);
          })
        : tarPackSyncEntryStream.on("data", (tarPackSyncRawData) => {
            super[packRawWriteSymbol](tarPackSyncRawData);
          });
    }
  },
  createTarFileSync = (tarCreateFileSyncOptions, tarCreateFileSyncPaths) => {
    let tarCreateFileSyncPack = new PackSync(tarCreateFileSyncOptions),
      tarCreateFileSyncWriteStream = new WriteStreamSync(
        tarCreateFileSyncOptions.file,
        { mode: tarCreateFileSyncOptions.mode || 438 },
      );
    tarCreateFileSyncPack.pipe(tarCreateFileSyncWriteStream),
      addTarCreatePathsSync(tarCreateFileSyncPack, tarCreateFileSyncPaths);
  },
  createTarFileAsync = (tarCreateFileAsyncOptions, tarCreateFileAsyncPaths) => {
    let tarCreateFileAsyncPack = new Pack(tarCreateFileAsyncOptions),
      tarCreateFileAsyncWriteStream = new WriteStream(
        tarCreateFileAsyncOptions.file,
        { mode: tarCreateFileAsyncOptions.mode || 438 },
      );
    tarCreateFileAsyncPack.pipe(tarCreateFileAsyncWriteStream);
    let tarCreateFileAsyncCompletion = new Promise(
      (resolveTarCreateFileAsync, rejectTarCreateFileAsync) => {
        tarCreateFileAsyncWriteStream.on("error", rejectTarCreateFileAsync),
          tarCreateFileAsyncWriteStream.on("close", resolveTarCreateFileAsync),
          tarCreateFileAsyncPack.on("error", rejectTarCreateFileAsync);
      },
    );
    return (
      addTarCreatePathsAsync(
        tarCreateFileAsyncPack,
        tarCreateFileAsyncPaths,
      ).catch((tarCreateFileAsyncAddPathsError) =>
        tarCreateFileAsyncPack.emit("error", tarCreateFileAsyncAddPathsError),
      ),
      tarCreateFileAsyncCompletion
    );
  },
  addTarCreatePathsSync = (tarCreatePathsSyncPack, tarCreatePathsSyncList) => {
    tarCreatePathsSyncList.forEach((tarCreatePathsSyncSpec) => {
      tarCreatePathsSyncSpec.charAt(0) === "@"
        ? tarList({
            file: tarCreatePath.resolve(
              tarCreatePathsSyncPack.cwd,
              tarCreatePathsSyncSpec.slice(1),
            ),
            sync: true,
            noResume: true,
            onReadEntry: (tarCreatePathsSyncListedEntry) =>
              tarCreatePathsSyncPack.add(tarCreatePathsSyncListedEntry),
          })
        : tarCreatePathsSyncPack.add(tarCreatePathsSyncSpec);
    }),
      tarCreatePathsSyncPack.end();
  },
  addTarCreatePathsAsync = async (
    tarCreatePathsAsyncPack,
    tarCreatePathsAsyncList,
  ) => {
    for (let tarCreatePathsAsyncSpec of tarCreatePathsAsyncList)
      tarCreatePathsAsyncSpec.charAt(0) === "@"
        ? await tarList({
            file: tarCreatePath.resolve(
              String(tarCreatePathsAsyncPack.cwd),
              tarCreatePathsAsyncSpec.slice(1),
            ),
            noResume: true,
            onReadEntry: (tarCreatePathsAsyncListedEntry) => {
              tarCreatePathsAsyncPack.add(tarCreatePathsAsyncListedEntry);
            },
          })
        : tarCreatePathsAsyncPack.add(tarCreatePathsAsyncSpec);
    tarCreatePathsAsyncPack.end();
  },
  createTarStreamSync = (
    tarCreateStreamSyncOptions,
    tarCreateStreamSyncPaths,
  ) => {
    let tarCreateStreamSyncPack = new PackSync(tarCreateStreamSyncOptions);
    return (
      addTarCreatePathsSync(tarCreateStreamSyncPack, tarCreateStreamSyncPaths),
      tarCreateStreamSyncPack
    );
  },
  createTarStreamAsync = (
    tarCreateStreamAsyncOptions,
    tarCreateStreamAsyncPaths,
  ) => {
    let tarCreateStreamAsyncPack = new Pack(tarCreateStreamAsyncOptions);
    return (
      addTarCreatePathsAsync(
        tarCreateStreamAsyncPack,
        tarCreateStreamAsyncPaths,
      ).catch((tarCreateStreamAsyncAddPathsError) =>
        tarCreateStreamAsyncPack.emit(
          "error",
          tarCreateStreamAsyncAddPathsError,
        ),
      ),
      tarCreateStreamAsyncPack
    );
  },
  tarCreate = createTarFacade(
    createTarFileSync,
    createTarFileAsync,
    createTarStreamSync,
    createTarStreamAsync,
    (tarCreateFacadeOptions, tarCreateFacadePaths) => {
      if (!tarCreateFacadePaths?.length)
        throw TypeError("no paths specified to add to archive");
    },
  ),
  tarFakePlatform = process.env.__FAKE_PLATFORM__ || process.platform,
  isTarWin32 = tarFakePlatform === "win32",
  {
    O_CREAT: fsOpenCreateFlag,
    O_NOFOLLOW: fsOpenNoFollowFlag,
    O_TRUNC: fsOpenTruncFlag,
    O_WRONLY: fsOpenWriteOnlyFlag,
  } = writeOpenFs.constants,
  fsOpenFilemapFlag =
    Number(process.env.__FAKE_FS_O_FILENAME__) ||
    writeOpenFs.constants.UV_FS_O_FILEMAP ||
    0,
  useWin32Filemap = isTarWin32 && !!fsOpenFilemapFlag,
  filemapSizeThreshold = 524288,
  win32FilemapOpenFlags =
    fsOpenFilemapFlag |
    fsOpenTruncFlag |
    fsOpenCreateFlag |
    fsOpenWriteOnlyFlag,
  posixNoFollowOpenFlags =
    !isTarWin32 && typeof fsOpenNoFollowFlag == "number"
      ? fsOpenNoFollowFlag |
        fsOpenTruncFlag |
        fsOpenCreateFlag |
        fsOpenWriteOnlyFlag
      : null,
  selectTarWriteOpenFlags =
    posixNoFollowOpenFlags !== null
      ? () => posixNoFollowOpenFlags
      : useWin32Filemap
        ? (tarWriteFileSize) =>
            tarWriteFileSize < filemapSizeThreshold
              ? win32FilemapOpenFlags
              : "w"
        : () => "w",
  lchownSyncIgnoreEnoent = (lchownSyncPath, lchownSyncUid, lchownSyncGid) => {
    try {
      return chownFs.lchownSync(lchownSyncPath, lchownSyncUid, lchownSyncGid);
    } catch (lchownSyncError) {
      if (lchownSyncError?.code !== "ENOENT") throw lchownSyncError;
    }
  },
  lchownIgnoreEnoent = (
    lchownAsyncPath,
    lchownAsyncUid,
    lchownAsyncGid,
    lchownAsyncCallback,
  ) => {
    chownFs.lchown(
      lchownAsyncPath,
      lchownAsyncUid,
      lchownAsyncGid,
      (lchownAsyncError) => {
        lchownAsyncCallback(
          lchownAsyncError && lchownAsyncError?.code !== "ENOENT"
            ? lchownAsyncError
            : null,
        );
      },
    );
  },
  chownChildAsync = (
    chownChildAsyncBasePath,
    chownChildAsyncDirent,
    chownChildAsyncUid,
    chownChildAsyncGid,
    chownChildAsyncCallback,
  ) => {
    if (chownChildAsyncDirent.isDirectory())
      chownrAsync(
        chownPath.resolve(chownChildAsyncBasePath, chownChildAsyncDirent.name),
        chownChildAsyncUid,
        chownChildAsyncGid,
        (chownChildAsyncRecurseError) => {
          if (chownChildAsyncRecurseError)
            return chownChildAsyncCallback(chownChildAsyncRecurseError);
          let chownChildAsyncDirectoryPath = chownPath.resolve(
            chownChildAsyncBasePath,
            chownChildAsyncDirent.name,
          );
          lchownIgnoreEnoent(
            chownChildAsyncDirectoryPath,
            chownChildAsyncUid,
            chownChildAsyncGid,
            chownChildAsyncCallback,
          );
        },
      );
    else {
      let chownChildAsyncFilePath = chownPath.resolve(
        chownChildAsyncBasePath,
        chownChildAsyncDirent.name,
      );
      lchownIgnoreEnoent(
        chownChildAsyncFilePath,
        chownChildAsyncUid,
        chownChildAsyncGid,
        chownChildAsyncCallback,
      );
    }
  },
  chownrAsync = (
    chownrAsyncPath,
    chownrAsyncUid,
    chownrAsyncGid,
    chownrAsyncCallback,
  ) => {
    chownFs.readdir(
      chownrAsyncPath,
      { withFileTypes: true },
      (chownrAsyncReaddirError, chownrAsyncDirents) => {
        if (chownrAsyncReaddirError) {
          if (chownrAsyncReaddirError.code === "ENOENT")
            return chownrAsyncCallback();
          if (
            chownrAsyncReaddirError.code !== "ENOTDIR" &&
            chownrAsyncReaddirError.code !== "ENOTSUP"
          )
            return chownrAsyncCallback(chownrAsyncReaddirError);
        }
        if (chownrAsyncReaddirError || !chownrAsyncDirents.length)
          return lchownIgnoreEnoent(
            chownrAsyncPath,
            chownrAsyncUid,
            chownrAsyncGid,
            chownrAsyncCallback,
          );
        let chownrAsyncPendingChildren = chownrAsyncDirents.length,
          chownrAsyncFirstError = null,
          chownrAsyncChildDone = (chownrAsyncChildError) => {
            if (!chownrAsyncFirstError) {
              if (chownrAsyncChildError)
                return chownrAsyncCallback(
                  (chownrAsyncFirstError = chownrAsyncChildError),
                );
              if (--chownrAsyncPendingChildren === 0)
                return lchownIgnoreEnoent(
                  chownrAsyncPath,
                  chownrAsyncUid,
                  chownrAsyncGid,
                  chownrAsyncCallback,
                );
            }
          };
        for (let chownrAsyncChildDirent of chownrAsyncDirents)
          chownChildAsync(
            chownrAsyncPath,
            chownrAsyncChildDirent,
            chownrAsyncUid,
            chownrAsyncGid,
            chownrAsyncChildDone,
          );
      },
    );
  },
  chownChildSync = (
    chownChildSyncBasePath,
    chownChildSyncDirent,
    chownChildSyncUid,
    chownChildSyncGid,
  ) => {
    chownChildSyncDirent.isDirectory() &&
      chownrSync(
        chownPath.resolve(chownChildSyncBasePath, chownChildSyncDirent.name),
        chownChildSyncUid,
        chownChildSyncGid,
      ),
      lchownSyncIgnoreEnoent(
        chownPath.resolve(chownChildSyncBasePath, chownChildSyncDirent.name),
        chownChildSyncUid,
        chownChildSyncGid,
      );
  },
  chownrSync = (chownrSyncPath, chownrSyncUid, chownrSyncGid) => {
    let chownrSyncDirents;
    try {
      chownrSyncDirents = chownFs.readdirSync(chownrSyncPath, {
        withFileTypes: true,
      });
    } catch (chownrSyncCaughtError) {
      let chownrSyncReaddirError = chownrSyncCaughtError;
      if (chownrSyncReaddirError?.code === "ENOENT") return;
      if (
        chownrSyncReaddirError?.code === "ENOTDIR" ||
        chownrSyncReaddirError?.code === "ENOTSUP"
      )
        return lchownSyncIgnoreEnoent(
          chownrSyncPath,
          chownrSyncUid,
          chownrSyncGid,
        );
      throw chownrSyncReaddirError;
    }
    for (let chownrSyncChildDirent of chownrSyncDirents)
      chownChildSync(
        chownrSyncPath,
        chownrSyncChildDirent,
        chownrSyncUid,
        chownrSyncGid,
      );
    return lchownSyncIgnoreEnoent(chownrSyncPath, chownrSyncUid, chownrSyncGid);
  },
  CwdError = class extends Error {
    path;
    code;
    syscall = "chdir";
    constructor(cwdErrorPath, cwdErrorCode) {
      super(cwdErrorCode + ": Cannot cd into '" + cwdErrorPath + "\x27"),
        (this.path = cwdErrorPath),
        (this.code = cwdErrorCode);
    }
    get name() {
      return "CwdError";
    }
  },
  SymlinkError = class extends Error {
    path;
    symlink;
    syscall = "symlink";
    code = "TAR_SYMLINK_ERROR";
    constructor(tarSymlinkTargetPath, tarSymlinkBlockedPath) {
      super("TAR_SYMLINK_ERROR: Cannot extract through symbolic link"),
        (this.symlink = tarSymlinkTargetPath),
        (this.path = tarSymlinkBlockedPath);
    }
    get name() {
      return "SymlinkError";
    }
  },
  checkCwdAsync = (checkCwdAsyncPath, checkCwdAsyncCallback) => {
    mkdirFs.stat(checkCwdAsyncPath, (checkCwdAsyncError, checkCwdAsyncStat) => {
      (checkCwdAsyncError || !checkCwdAsyncStat.isDirectory()) &&
        (checkCwdAsyncError = new CwdError(
          checkCwdAsyncPath,
          checkCwdAsyncError?.code || "ENOTDIR",
        )),
        checkCwdAsyncCallback(checkCwdAsyncError);
    });
  },
  mkdirAsync = (mkdirAsyncPath, mkdirAsyncOptions, mkdirAsyncCallback) => {
    mkdirAsyncPath = normalizeTarPath(mkdirAsyncPath);
    let mkdirAsyncUmask = mkdirAsyncOptions.umask ?? 18,
      mkdirAsyncMode = mkdirAsyncOptions.mode | 448,
      mkdirAsyncNeedsChmod = (mkdirAsyncMode & mkdirAsyncUmask) !== 0,
      mkdirAsyncUid = mkdirAsyncOptions.uid,
      mkdirAsyncGid = mkdirAsyncOptions.gid,
      mkdirAsyncNeedsChown =
        typeof mkdirAsyncUid == "number" &&
        typeof mkdirAsyncGid == "number" &&
        (mkdirAsyncUid !== mkdirAsyncOptions.processUid ||
          mkdirAsyncGid !== mkdirAsyncOptions.processGid),
      mkdirAsyncPreserve = mkdirAsyncOptions.preserve,
      mkdirAsyncUnlink = mkdirAsyncOptions.unlink,
      mkdirAsyncCwd = normalizeTarPath(mkdirAsyncOptions.cwd),
      mkdirAsyncDone = (mkdirAsyncDoneError, mkdirAsyncCreatedPath) => {
        mkdirAsyncDoneError
          ? mkdirAsyncCallback(mkdirAsyncDoneError)
          : mkdirAsyncCreatedPath && mkdirAsyncNeedsChown
            ? chownrAsync(
                mkdirAsyncCreatedPath,
                mkdirAsyncUid,
                mkdirAsyncGid,
                (mkdirAsyncChownError) => mkdirAsyncDone(mkdirAsyncChownError),
              )
            : mkdirAsyncNeedsChmod
              ? mkdirFs.chmod(
                  mkdirAsyncPath,
                  mkdirAsyncMode,
                  mkdirAsyncCallback,
                )
              : mkdirAsyncCallback();
      };
    if (mkdirAsyncPath === mkdirAsyncCwd)
      return checkCwdAsync(mkdirAsyncPath, mkdirAsyncDone);
    if (mkdirAsyncPreserve)
      return mkdirFsPromises
        .mkdir(mkdirAsyncPath, { mode: mkdirAsyncMode, recursive: true })
        .then(
          (mkdirAsyncRecursiveCreatedPath) =>
            mkdirAsyncDone(null, mkdirAsyncRecursiveCreatedPath ?? void 0),
          mkdirAsyncDone,
        );
    let mkdirAsyncRelativeSegments = normalizeTarPath(
      mkdirPath.relative(mkdirAsyncCwd, mkdirAsyncPath),
    ).split("/");
    mkdirRecursiveAsync(
      mkdirAsyncCwd,
      mkdirAsyncRelativeSegments,
      mkdirAsyncMode,
      mkdirAsyncUnlink,
      mkdirAsyncCwd,
      void 0,
      mkdirAsyncDone,
    );
  },
  mkdirRecursiveAsync = (
    mkdirRecursiveAsyncBasePath,
    mkdirRecursiveAsyncSegments,
    mkdirRecursiveAsyncMode,
    mkdirRecursiveAsyncUnlink,
    mkdirRecursiveAsyncCwd,
    mkdirRecursiveAsyncFirstCreated,
    mkdirRecursiveAsyncCallback,
  ) => {
    if (mkdirRecursiveAsyncSegments.length === 0)
      return mkdirRecursiveAsyncCallback(null, mkdirRecursiveAsyncFirstCreated);
    let mkdirRecursiveAsyncSegment = mkdirRecursiveAsyncSegments.shift(),
      mkdirRecursiveAsyncNextPath = normalizeTarPath(
        mkdirPath.resolve(
          mkdirRecursiveAsyncBasePath + "/" + mkdirRecursiveAsyncSegment,
        ),
      );
    mkdirFs.mkdir(
      mkdirRecursiveAsyncNextPath,
      mkdirRecursiveAsyncMode,
      mkdirRetryAfterCollision(
        mkdirRecursiveAsyncNextPath,
        mkdirRecursiveAsyncSegments,
        mkdirRecursiveAsyncMode,
        mkdirRecursiveAsyncUnlink,
        mkdirRecursiveAsyncCwd,
        mkdirRecursiveAsyncFirstCreated,
        mkdirRecursiveAsyncCallback,
      ),
    );
  },
  mkdirRetryAfterCollision =
    (
      mkdirRetryPath,
      mkdirRetrySegments,
      mkdirRetryMode,
      mkdirRetryUnlink,
      mkdirRetryCwd,
      mkdirRetryFirstCreated,
      mkdirRetryCallback,
    ) =>
    (mkdirCollisionError) => {
      mkdirCollisionError
        ? mkdirFs.lstat(
            mkdirRetryPath,
            (mkdirCollisionLstatError, mkdirCollisionStat) => {
              if (mkdirCollisionLstatError)
                (mkdirCollisionLstatError.path =
                  mkdirCollisionLstatError.path &&
                  normalizeTarPath(mkdirCollisionLstatError.path)),
                  mkdirRetryCallback(mkdirCollisionLstatError);
              else {
                if (mkdirCollisionStat.isDirectory())
                  mkdirRecursiveAsync(
                    mkdirRetryPath,
                    mkdirRetrySegments,
                    mkdirRetryMode,
                    mkdirRetryUnlink,
                    mkdirRetryCwd,
                    mkdirRetryFirstCreated,
                    mkdirRetryCallback,
                  );
                else {
                  if (mkdirRetryUnlink)
                    mkdirFs.unlink(
                      mkdirRetryPath,
                      (mkdirCollisionUnlinkError) => {
                        if (mkdirCollisionUnlinkError)
                          return mkdirRetryCallback(mkdirCollisionUnlinkError);
                        mkdirFs.mkdir(
                          mkdirRetryPath,
                          mkdirRetryMode,
                          mkdirRetryAfterCollision(
                            mkdirRetryPath,
                            mkdirRetrySegments,
                            mkdirRetryMode,
                            mkdirRetryUnlink,
                            mkdirRetryCwd,
                            mkdirRetryFirstCreated,
                            mkdirRetryCallback,
                          ),
                        );
                      },
                    );
                  else {
                    if (mkdirCollisionStat.isSymbolicLink())
                      return mkdirRetryCallback(
                        new SymlinkError(
                          mkdirRetryPath,
                          mkdirRetryPath + "/" + mkdirRetrySegments.join("/"),
                        ),
                      );
                    mkdirRetryCallback(mkdirCollisionError);
                  }
                }
              }
            },
          )
        : ((mkdirRetryFirstCreated = mkdirRetryFirstCreated || mkdirRetryPath),
          mkdirRecursiveAsync(
            mkdirRetryPath,
            mkdirRetrySegments,
            mkdirRetryMode,
            mkdirRetryUnlink,
            mkdirRetryCwd,
            mkdirRetryFirstCreated,
            mkdirRetryCallback,
          ));
    },
  checkCwdSync = (checkCwdSyncPath) => {
    let checkCwdSyncIsDirectory = false,
      checkCwdSyncErrorCode;
    try {
      checkCwdSyncIsDirectory = mkdirFs
        .statSync(checkCwdSyncPath)
        .isDirectory();
    } catch (checkCwdSyncError) {
      checkCwdSyncErrorCode = checkCwdSyncError?.code;
    } finally {
      if (!checkCwdSyncIsDirectory)
        throw new CwdError(
          checkCwdSyncPath,
          checkCwdSyncErrorCode ?? "ENOTDIR",
        );
    }
  },
  mkdirSync = (mkdirSyncPath, mkdirSyncOptions) => {
    mkdirSyncPath = normalizeTarPath(mkdirSyncPath);
    let mkdirSyncUmask = mkdirSyncOptions.umask ?? 18,
      mkdirSyncMode = mkdirSyncOptions.mode | 448,
      mkdirSyncNeedsChmod = (mkdirSyncMode & mkdirSyncUmask) !== 0,
      mkdirSyncUid = mkdirSyncOptions.uid,
      mkdirSyncGid = mkdirSyncOptions.gid,
      mkdirSyncNeedsChown =
        typeof mkdirSyncUid == "number" &&
        typeof mkdirSyncGid == "number" &&
        (mkdirSyncUid !== mkdirSyncOptions.processUid ||
          mkdirSyncGid !== mkdirSyncOptions.processGid),
      mkdirSyncPreserve = mkdirSyncOptions.preserve,
      mkdirSyncUnlink = mkdirSyncOptions.unlink,
      mkdirSyncCwd = normalizeTarPath(mkdirSyncOptions.cwd),
      mkdirSyncApplyMetadata = (mkdirSyncCreatedPath) => {
        mkdirSyncCreatedPath &&
          mkdirSyncNeedsChown &&
          chownrSync(mkdirSyncCreatedPath, mkdirSyncUid, mkdirSyncGid),
          mkdirSyncNeedsChmod &&
            mkdirFs.chmodSync(mkdirSyncPath, mkdirSyncMode);
      };
    if (mkdirSyncPath === mkdirSyncCwd)
      return checkCwdSync(mkdirSyncCwd), mkdirSyncApplyMetadata();
    if (mkdirSyncPreserve)
      return mkdirSyncApplyMetadata(
        mkdirFs.mkdirSync(mkdirSyncPath, {
          mode: mkdirSyncMode,
          recursive: true,
        }) ?? void 0,
      );
    let mkdirSyncRelativeSegments = normalizeTarPath(
        mkdirPath.relative(mkdirSyncCwd, mkdirSyncPath),
      ).split("/"),
      mkdirSyncFirstCreated;
    for (
      let mkdirSyncSegment = mkdirSyncRelativeSegments.shift(),
        mkdirSyncCurrentPath = mkdirSyncCwd;
      mkdirSyncSegment && (mkdirSyncCurrentPath += "/" + mkdirSyncSegment);
      mkdirSyncSegment = mkdirSyncRelativeSegments.shift()
    ) {
      mkdirSyncCurrentPath = normalizeTarPath(
        mkdirPath.resolve(mkdirSyncCurrentPath),
      );
      try {
        mkdirFs.mkdirSync(mkdirSyncCurrentPath, mkdirSyncMode),
          (mkdirSyncFirstCreated =
            mkdirSyncFirstCreated || mkdirSyncCurrentPath);
      } catch {
        let mkdirSyncCollisionStat = mkdirFs.lstatSync(mkdirSyncCurrentPath);
        if (mkdirSyncCollisionStat.isDirectory()) continue;
        if (mkdirSyncUnlink) {
          mkdirFs.unlinkSync(mkdirSyncCurrentPath),
            mkdirFs.mkdirSync(mkdirSyncCurrentPath, mkdirSyncMode),
            (mkdirSyncFirstCreated =
              mkdirSyncFirstCreated || mkdirSyncCurrentPath);
          continue;
        } else {
          if (mkdirSyncCollisionStat.isSymbolicLink())
            return new SymlinkError(
              mkdirSyncCurrentPath,
              mkdirSyncCurrentPath + "/" + mkdirSyncRelativeSegments.join("/"),
            );
        }
      }
    }
    return mkdirSyncApplyMetadata(mkdirSyncFirstCreated);
  },
  pathReservationCaseCache = Object.create(null),
  pathReservationCacheLimit = 10000,
  pathReservationRecentPaths = new Set(),
  normalizePathForReservation = (reservationPath) => {
    pathReservationRecentPaths.has(reservationPath)
      ? pathReservationRecentPaths.delete(reservationPath)
      : (pathReservationCaseCache[reservationPath] = reservationPath
          .normalize("NFD")
          .toLocaleLowerCase("en")
          .toLocaleUpperCase("en")),
      pathReservationRecentPaths.add(reservationPath);
    let reservationNormalizedPath = pathReservationCaseCache[reservationPath],
      reservationCacheOverflow =
        pathReservationRecentPaths.size - pathReservationCacheLimit;
    if (reservationCacheOverflow > pathReservationCacheLimit / 10) {
      for (let reservationOldPath of pathReservationRecentPaths)
        if (
          (pathReservationRecentPaths.delete(reservationOldPath),
          delete pathReservationCaseCache[reservationOldPath],
          --reservationCacheOverflow <= 0)
        )
          break;
    }
    return reservationNormalizedPath;
  },
  pathReservationsPlatform =
    process.env.TESTING_TAR_FAKE_PLATFORM || process.platform,
  isPathReservationsWin32 = pathReservationsPlatform === "win32",
  parentDirectoriesForPath = (reservationParentPath) =>
    reservationParentPath
      .split("/")
      .slice(0, -1)
      .reduce((reservationParentList, reservationParentSegment) => {
        let reservationPreviousParent = reservationParentList.at(-1);
        return (
          reservationPreviousParent !== void 0 &&
            (reservationParentSegment = reservationPathJoin(
              reservationPreviousParent,
              reservationParentSegment,
            )),
          reservationParentList.push(reservationParentSegment || "/"),
          reservationParentList
        );
      }, []),
  PathReservations = class {
    #reservationQueuesByPath = new Map();
    #reservationRecords = new Map();
    #activeReservations = new Set();
    reserve(reservationRequestedPaths, reservationFunction) {
      reservationRequestedPaths = isPathReservationsWin32
        ? ["win32 parallelization disabled"]
        : reservationRequestedPaths.map((reservationRequestedPath) =>
            stripTrailingSlashes(
              reservationPathJoin(
                normalizePathForReservation(reservationRequestedPath),
              ),
            ),
          );
      let reservationParentDirs = new Set(
        reservationRequestedPaths
          .map((reservationPathForParents) =>
            parentDirectoriesForPath(reservationPathForParents),
          )
          .reduce((reservationParentAccumulator, reservationParentDirList) =>
            reservationParentAccumulator.concat(reservationParentDirList),
          ),
      );
      this.#reservationRecords.set(reservationFunction, {
        dirs: reservationParentDirs,
        paths: reservationRequestedPaths,
      });
      for (let reservationConcretePath of reservationRequestedPaths) {
        let reservationPathQueue = this.#reservationQueuesByPath.get(
          reservationConcretePath,
        );
        reservationPathQueue
          ? reservationPathQueue.push(reservationFunction)
          : this.#reservationQueuesByPath.set(reservationConcretePath, [
              reservationFunction,
            ]);
      }
      for (let reservationParentDir of reservationParentDirs) {
        let reservationParentQueue =
          this.#reservationQueuesByPath.get(reservationParentDir);
        if (!reservationParentQueue)
          this.#reservationQueuesByPath.set(reservationParentDir, [
            new Set([reservationFunction]),
          ]);
        else {
          let reservationParentQueueTail = reservationParentQueue.at(-1);
          reservationParentQueueTail instanceof Set
            ? reservationParentQueueTail.add(reservationFunction)
            : reservationParentQueue.push(new Set([reservationFunction]));
        }
      }
      return this.#tryStartReservation(reservationFunction);
    }
    #lookupReservationQueues(reservationLookupFunction) {
      let reservationRecord = this.#reservationRecords.get(
        reservationLookupFunction,
      );
      if (!reservationRecord)
        throw Error("function does not have any path reservations");
      return {
        paths: reservationRecord.paths.map((reservationLookupPath) =>
          this.#reservationQueuesByPath.get(reservationLookupPath),
        ),
        dirs: [...reservationRecord.dirs].map((reservationLookupDir) =>
          this.#reservationQueuesByPath.get(reservationLookupDir),
        ),
      };
    }
    check(reservationCheckFunction) {
      let {
        paths: reservationCheckPathQueues,
        dirs: reservationCheckDirQueues,
      } = this.#lookupReservationQueues(reservationCheckFunction);
      return (
        reservationCheckPathQueues.every(
          (reservationCheckPathQueue) =>
            reservationCheckPathQueue &&
            reservationCheckPathQueue[0] === reservationCheckFunction,
        ) &&
        reservationCheckDirQueues.every(
          (reservationCheckDirQueue) =>
            reservationCheckDirQueue &&
            reservationCheckDirQueue[0] instanceof Set &&
            reservationCheckDirQueue[0].has(reservationCheckFunction),
        )
      );
    }
    #tryStartReservation(reservationStartFunction) {
      return this.#activeReservations.has(reservationStartFunction) ||
        !this.check(reservationStartFunction)
        ? false
        : (this.#activeReservations.add(reservationStartFunction),
          reservationStartFunction(() =>
            this.#releaseReservation(reservationStartFunction),
          ),
          true);
    }
    #releaseReservation(reservationReleaseFunction) {
      if (!this.#activeReservations.has(reservationReleaseFunction))
        return false;
      let reservationReleaseRecord = this.#reservationRecords.get(
        reservationReleaseFunction,
      );
      if (!reservationReleaseRecord) throw Error("invalid reservation");
      let { paths: reservationReleasePaths, dirs: reservationReleaseDirs } =
          reservationReleaseRecord,
        reservationRetryFunctions = new Set();
      for (let reservationReleasePath of reservationReleasePaths) {
        let reservationReleasePathQueue = this.#reservationQueuesByPath.get(
          reservationReleasePath,
        );
        if (
          !reservationReleasePathQueue ||
          reservationReleasePathQueue?.[0] !== reservationReleaseFunction
        )
          continue;
        let reservationNextPathWaiter = reservationReleasePathQueue[1];
        if (!reservationNextPathWaiter) {
          this.#reservationQueuesByPath.delete(reservationReleasePath);
          continue;
        }
        if (
          (reservationReleasePathQueue.shift(),
          typeof reservationNextPathWaiter == "function")
        )
          reservationRetryFunctions.add(reservationNextPathWaiter);
        else {
          for (let reservationPathWaiter of reservationNextPathWaiter)
            reservationRetryFunctions.add(reservationPathWaiter);
        }
      }
      for (let reservationReleaseDir of reservationReleaseDirs) {
        let reservationReleaseDirQueue = this.#reservationQueuesByPath.get(
            reservationReleaseDir,
          ),
          reservationActiveDirSet = reservationReleaseDirQueue?.[0];
        if (
          !(
            !reservationReleaseDirQueue ||
            !(reservationActiveDirSet instanceof Set)
          )
        ) {
          if (
            reservationActiveDirSet.size === 1 &&
            reservationReleaseDirQueue.length === 1
          ) {
            this.#reservationQueuesByPath.delete(reservationReleaseDir);
            continue;
          } else {
            if (reservationActiveDirSet.size === 1) {
              reservationReleaseDirQueue.shift();
              let reservationNextDirWaiter = reservationReleaseDirQueue[0];
              typeof reservationNextDirWaiter == "function" &&
                reservationRetryFunctions.add(reservationNextDirWaiter);
            } else reservationActiveDirSet.delete(reservationReleaseFunction);
          }
        }
      }
      return (
        this.#activeReservations.delete(reservationReleaseFunction),
        reservationRetryFunctions.forEach((reservationRetryFunction) =>
          this.#tryStartReservation(reservationRetryFunction),
        ),
        true
      );
    }
  },
  processUmask = () => process.umask(),
  onEntrySymbol = Symbol("onEntry"),
  checkFsSymbol = Symbol("checkFs"),
  checkFs2Symbol = Symbol("checkFs2"),
  isReusableSymbol = Symbol("isReusable"),
  makeFsSymbol = Symbol("makeFs"),
  unpackFileSymbol = Symbol("file"),
  unpackDirectorySymbol = Symbol("directory"),
  linkSymbol = Symbol("link"),
  unpackSymlinkSymbol = Symbol("symlink"),
  unpackHardlinkSymbol = Symbol("hardlink"),
  ensureNoSymlinkSymbol = Symbol("ensureNoSymlink"),
  unsupportedSymbol = Symbol("unsupported"),
  checkPathSymbol = Symbol("checkPath"),
  stripAbsolutePathSymbol = Symbol("stripAbsolutePath"),
  mkdirSymbol = Symbol("mkdir"),
  onErrorSymbol = Symbol("onError"),
  pendingSymbol = Symbol("pending"),
  pendSymbol = Symbol("pend"),
  unpendSymbol = Symbol("unpend"),
  unpackEndedSymbol = Symbol("ended"),
  maybeCloseSymbol = Symbol("maybeClose"),
  skipSymbol = Symbol("skip"),
  doChownSymbol = Symbol("doChown"),
  uidSymbol = Symbol("uid"),
  gidSymbol = Symbol("gid"),
  checkedCwdSymbol = Symbol("checkedCwd"),
  tarExtractPlatform =
    process.env.TESTING_TAR_FAKE_PLATFORM || process.platform,
  isTarExtractWin32 = tarExtractPlatform === "win32",
  defaultMaxExtractDepth = 1024,
  unlinkFileAsync = (unlinkAsyncPath, unlinkAsyncCallback) => {
    if (!isTarExtractWin32)
      return unpackFs.unlink(unlinkAsyncPath, unlinkAsyncCallback);
    let unlinkAsyncTemporaryPath =
      unlinkAsyncPath + ".DELETE." + extractRandomBytes(16).toString("hex");
    unpackFs.rename(
      unlinkAsyncPath,
      unlinkAsyncTemporaryPath,
      (unlinkAsyncRenameError) => {
        if (unlinkAsyncRenameError)
          return unlinkAsyncCallback(unlinkAsyncRenameError);
        unpackFs.unlink(unlinkAsyncTemporaryPath, unlinkAsyncCallback);
      },
    );
  },
  unlinkFileSync = (unlinkSyncPath) => {
    if (!isTarExtractWin32) return unpackFs.unlinkSync(unlinkSyncPath);
    let unlinkSyncTemporaryPath =
      unlinkSyncPath + ".DELETE." + extractRandomBytes(16).toString("hex");
    unpackFs.renameSync(unlinkSyncPath, unlinkSyncTemporaryPath),
      unpackFs.unlinkSync(unlinkSyncTemporaryPath);
  },
  chooseOwnerId = (preferredOwnerId, fallbackOwnerId, defaultOwnerId) =>
    preferredOwnerId !== void 0 && preferredOwnerId === preferredOwnerId >>> 0
      ? preferredOwnerId
      : fallbackOwnerId !== void 0 && fallbackOwnerId === fallbackOwnerId >>> 0
        ? fallbackOwnerId
        : defaultOwnerId,
  Unpack = class extends Parser {
    [unpackEndedSymbol] = false;
    [checkedCwdSymbol] = false;
    [pendingSymbol] = 0;
    reservations = new PathReservations();
    transform;
    writable = true;
    readable = false;
    uid;
    gid;
    setOwner;
    preserveOwner;
    processGid;
    processUid;
    maxDepth;
    forceChown;
    win32;
    newer;
    keep;
    noMtime;
    preservePaths;
    unlink;
    cwd;
    strip;
    processUmask;
    umask;
    dmode;
    fmode;
    chmod;
    constructor(unpackOptions = {}) {
      if (
        ((unpackOptions.ondone = () => {
          (this[unpackEndedSymbol] = true), this[maybeCloseSymbol]();
        }),
        super(unpackOptions),
        (this.transform = unpackOptions.transform),
        (this.chmod = !!unpackOptions.chmod),
        typeof unpackOptions.uid == "number" ||
          typeof unpackOptions.gid == "number")
      ) {
        if (
          typeof unpackOptions.uid != "number" ||
          typeof unpackOptions.gid != "number"
        )
          throw TypeError("cannot set owner without number uid and gid");
        if (unpackOptions.preserveOwner)
          throw TypeError(
            "cannot preserve owner in archive and also set owner explicitly",
          );
        (this.uid = unpackOptions.uid),
          (this.gid = unpackOptions.gid),
          (this.setOwner = true);
      } else (this.uid = void 0), (this.gid = void 0), (this.setOwner = false);
      (this.preserveOwner =
        unpackOptions.preserveOwner === void 0 &&
        typeof unpackOptions.uid != "number"
          ? !!(process.getuid && process.getuid() === 0)
          : !!unpackOptions.preserveOwner),
        (this.processUid =
          (this.preserveOwner || this.setOwner) && process.getuid
            ? process.getuid()
            : void 0),
        (this.processGid =
          (this.preserveOwner || this.setOwner) && process.getgid
            ? process.getgid()
            : void 0),
        (this.maxDepth =
          typeof unpackOptions.maxDepth == "number"
            ? unpackOptions.maxDepth
            : defaultMaxExtractDepth),
        (this.forceChown = unpackOptions.forceChown === true),
        (this.win32 = !!unpackOptions.win32 || isTarExtractWin32),
        (this.newer = !!unpackOptions.newer),
        (this.keep = !!unpackOptions.keep),
        (this.noMtime = !!unpackOptions.noMtime),
        (this.preservePaths = !!unpackOptions.preservePaths),
        (this.unlink = !!unpackOptions.unlink),
        (this.cwd = normalizeTarPath(
          unpackPath.resolve(unpackOptions.cwd || process.cwd()),
        )),
        (this.strip = Number(unpackOptions.strip) || 0),
        (this.processUmask = this.chmod
          ? typeof unpackOptions.processUmask == "number"
            ? unpackOptions.processUmask
            : processUmask()
          : 0),
        (this.umask =
          typeof unpackOptions.umask == "number"
            ? unpackOptions.umask
            : this.processUmask),
        (this.dmode = unpackOptions.dmode || 511 & ~this.umask),
        (this.fmode = unpackOptions.fmode || 438 & ~this.umask),
        this.on("entry", (unpackEntryEvent) =>
          this[onEntrySymbol](unpackEntryEvent),
        );
    }
    warn(unpackWarnCode, unpackWarnMessage, unpackWarnData = {}) {
      return (
        (unpackWarnCode === "TAR_BAD_ARCHIVE" ||
          unpackWarnCode === "TAR_ABORT") &&
          (unpackWarnData.recoverable = false),
        super.warn(unpackWarnCode, unpackWarnMessage, unpackWarnData)
      );
    }
    [maybeCloseSymbol]() {
      this[unpackEndedSymbol] &&
        this[pendingSymbol] === 0 &&
        (this.emit("prefinish"), this.emit("finish"), this.emit("end"));
    }
    [stripAbsolutePathSymbol](unpackPathEntry, unpackPathField) {
      let unpackRawPathValue = unpackPathEntry[unpackPathField],
        { type: unpackEntryType } = unpackPathEntry;
      if (!unpackRawPathValue || this.preservePaths) return true;
      let [unpackStrippedPathRoot, unpackRelativePathValue] =
          splitAbsolutePath(unpackRawPathValue),
        unpackPathSegments = unpackRelativePathValue
          .replaceAll(/\\/g, "/")
          .split("/");
      if (
        unpackPathSegments.includes("..") ||
        (isTarExtractWin32 && /^[a-z]:\.\.$/i.test(unpackPathSegments[0] ?? ""))
      ) {
        if (unpackPathField === "path" || unpackEntryType === "Link")
          return (
            this.warn("TAR_ENTRY_ERROR", unpackPathField + " contains '..'", {
              entry: unpackPathEntry,
              [unpackPathField]: unpackRawPathValue,
            }),
            false
          );
        let unpackEntryDirectory = unpackPath.posix.dirname(
            unpackPathEntry.path,
          ),
          unpackNormalizedLinkPath = unpackPath.posix.normalize(
            unpackPath.posix.join(
              unpackEntryDirectory,
              unpackPathSegments.join("/"),
            ),
          );
        if (
          unpackNormalizedLinkPath.startsWith("../") ||
          unpackNormalizedLinkPath === ".."
        )
          return (
            this.warn(
              "TAR_ENTRY_ERROR",
              unpackPathField + " escapes extraction directory",
              { entry: unpackPathEntry, [unpackPathField]: unpackRawPathValue },
            ),
            false
          );
      }
      return (
        unpackStrippedPathRoot &&
          ((unpackPathEntry[unpackPathField] = String(unpackRelativePathValue)),
          this.warn(
            "TAR_ENTRY_INFO",
            "stripping " +
              unpackStrippedPathRoot +
              " from absolute " +
              unpackPathField,
            { entry: unpackPathEntry, [unpackPathField]: unpackRawPathValue },
          )),
        true
      );
    }
    [checkPathSymbol](unpackCheckEntry) {
      let unpackNormalizedEntryPath = normalizeTarPath(unpackCheckEntry.path),
        unpackEntryPathSegments = unpackNormalizedEntryPath.split("/");
      if (this.strip) {
        if (unpackEntryPathSegments.length < this.strip) return false;
        if (unpackCheckEntry.type === "Link") {
          let unpackLinkPathSegments = normalizeTarPath(
            String(unpackCheckEntry.linkpath),
          ).split("/");
          if (unpackLinkPathSegments.length >= this.strip)
            unpackCheckEntry.linkpath = unpackLinkPathSegments
              .slice(this.strip)
              .join("/");
          else return false;
        }
        unpackEntryPathSegments.splice(0, this.strip),
          (unpackCheckEntry.path = unpackEntryPathSegments.join("/"));
      }
      if (
        isFinite(this.maxDepth) &&
        unpackEntryPathSegments.length > this.maxDepth
      )
        return (
          this.warn("TAR_ENTRY_ERROR", "path excessively deep", {
            entry: unpackCheckEntry,
            path: unpackNormalizedEntryPath,
            depth: unpackEntryPathSegments.length,
            maxDepth: this.maxDepth,
          }),
          false
        );
      if (
        !this[stripAbsolutePathSymbol](unpackCheckEntry, "path") ||
        !this[stripAbsolutePathSymbol](unpackCheckEntry, "linkpath")
      )
        return false;
      if (
        ((unpackCheckEntry.absolute = unpackPath.isAbsolute(
          unpackCheckEntry.path,
        )
          ? normalizeTarPath(unpackPath.resolve(unpackCheckEntry.path))
          : normalizeTarPath(
              unpackPath.resolve(this.cwd, unpackCheckEntry.path),
            )),
        !this.preservePaths &&
          typeof unpackCheckEntry.absolute == "string" &&
          unpackCheckEntry.absolute.indexOf(this.cwd + "/") !== 0 &&
          unpackCheckEntry.absolute !== this.cwd)
      )
        return (
          this.warn("TAR_ENTRY_ERROR", "path escaped extraction target", {
            entry: unpackCheckEntry,
            path: normalizeTarPath(unpackCheckEntry.path),
            resolvedPath: unpackCheckEntry.absolute,
            cwd: this.cwd,
          }),
          false
        );
      if (
        unpackCheckEntry.absolute === this.cwd &&
        unpackCheckEntry.type !== "Directory" &&
        unpackCheckEntry.type !== "GNUDumpDir"
      )
        return false;
      if (this.win32) {
        let { root: unpackWin32AbsoluteRoot } = unpackPath.win32.parse(
          String(unpackCheckEntry.absolute),
        );
        unpackCheckEntry.absolute =
          unpackWin32AbsoluteRoot +
          encodeWin32Path(
            String(unpackCheckEntry.absolute).slice(
              unpackWin32AbsoluteRoot.length,
            ),
          );
        let { root: unpackWin32EntryRoot } = unpackPath.win32.parse(
          unpackCheckEntry.path,
        );
        unpackCheckEntry.path =
          unpackWin32EntryRoot +
          encodeWin32Path(
            unpackCheckEntry.path.slice(unpackWin32EntryRoot.length),
          );
      }
      return true;
    }
    [onEntrySymbol](unpackDispatchEntry) {
      if (!this[checkPathSymbol](unpackDispatchEntry))
        return unpackDispatchEntry.resume();
      switch (
        (unpackAssert.equal(typeof unpackDispatchEntry.absolute, "string"),
        unpackDispatchEntry.type)
      ) {
        case "Directory":
        case "GNUDumpDir":
          unpackDispatchEntry.mode &&
            (unpackDispatchEntry.mode = unpackDispatchEntry.mode | 448);
        case "File":
        case "OldFile":
        case "ContiguousFile":
        case "Link":
        case "SymbolicLink":
          return this[checkFsSymbol](unpackDispatchEntry);
        default:
          return this[unsupportedSymbol](unpackDispatchEntry);
      }
    }
    [onErrorSymbol](unpackEntryError, unpackErroredEntry) {
      unpackEntryError.name === "CwdError"
        ? this.emit("error", unpackEntryError)
        : (this.warn("TAR_ENTRY_ERROR", unpackEntryError, {
            entry: unpackErroredEntry,
          }),
          this[unpendSymbol](),
          unpackErroredEntry.resume());
    }
    [mkdirSymbol](unpackMkdirPath, unpackMkdirMode, unpackMkdirCallback) {
      mkdirAsync(
        normalizeTarPath(unpackMkdirPath),
        {
          uid: this.uid,
          gid: this.gid,
          processUid: this.processUid,
          processGid: this.processGid,
          umask: this.processUmask,
          preserve: this.preservePaths,
          unlink: this.unlink,
          cwd: this.cwd,
          mode: unpackMkdirMode,
        },
        unpackMkdirCallback,
      );
    }
    [doChownSymbol](unpackChownEntry) {
      return (
        this.forceChown ||
        (this.preserveOwner &&
          ((typeof unpackChownEntry.uid == "number" &&
            unpackChownEntry.uid !== this.processUid) ||
            (typeof unpackChownEntry.gid == "number" &&
              unpackChownEntry.gid !== this.processGid))) ||
        (typeof this.uid == "number" && this.uid !== this.processUid) ||
        (typeof this.gid == "number" && this.gid !== this.processGid)
      );
    }
    [uidSymbol](unpackUidEntry) {
      return chooseOwnerId(this.uid, unpackUidEntry.uid, this.processUid);
    }
    [gidSymbol](unpackGidEntry) {
      return chooseOwnerId(this.gid, unpackGidEntry.gid, this.processGid);
    }
    [unpackFileSymbol](unpackFileEntry, unpackFileDone) {
      let unpackFileMode =
          typeof unpackFileEntry.mode == "number"
            ? unpackFileEntry.mode & 4095
            : this.fmode,
        unpackFileWriteStream = new WriteStream(
          String(unpackFileEntry.absolute),
          {
            flags: selectTarWriteOpenFlags(unpackFileEntry.size),
            mode: unpackFileMode,
            autoClose: false,
          },
        );
      unpackFileWriteStream.on("error", (unpackFileStreamError) => {
        unpackFileWriteStream.fd &&
          unpackFs.close(unpackFileWriteStream.fd, () => {}),
          (unpackFileWriteStream.write = () => true),
          this[onErrorSymbol](unpackFileStreamError, unpackFileEntry),
          unpackFileDone();
      });
      let unpackFilePendingOps = 1,
        unpackFileMetadataDone = (unpackFileMetadataError) => {
          if (unpackFileMetadataError) {
            unpackFileWriteStream.fd &&
              unpackFs.close(unpackFileWriteStream.fd, () => {}),
              this[onErrorSymbol](unpackFileMetadataError, unpackFileEntry),
              unpackFileDone();
            return;
          }
          --unpackFilePendingOps === 0 &&
            unpackFileWriteStream.fd !== void 0 &&
            unpackFs.close(unpackFileWriteStream.fd, (unpackFileCloseError) => {
              unpackFileCloseError
                ? this[onErrorSymbol](unpackFileCloseError, unpackFileEntry)
                : this[unpendSymbol](),
                unpackFileDone();
            });
        };
      unpackFileWriteStream.on("finish", () => {
        let unpackFileAbsolutePath = String(unpackFileEntry.absolute),
          unpackFileFd = unpackFileWriteStream.fd;
        if (
          typeof unpackFileFd == "number" &&
          unpackFileEntry.mtime &&
          !this.noMtime
        ) {
          unpackFilePendingOps++;
          let unpackFileAtime = unpackFileEntry.atime || new Date(),
            unpackFileMtime = unpackFileEntry.mtime;
          unpackFs.futimes(
            unpackFileFd,
            unpackFileAtime,
            unpackFileMtime,
            (unpackFileFutimesError) =>
              unpackFileFutimesError
                ? unpackFs.utimes(
                    unpackFileAbsolutePath,
                    unpackFileAtime,
                    unpackFileMtime,
                    (unpackFileUtimesError) =>
                      unpackFileMetadataDone(
                        unpackFileUtimesError && unpackFileFutimesError,
                      ),
                  )
                : unpackFileMetadataDone(),
          );
        }
        if (
          typeof unpackFileFd == "number" &&
          this[doChownSymbol](unpackFileEntry)
        ) {
          unpackFilePendingOps++;
          let unpackFileUid = this[uidSymbol](unpackFileEntry),
            unpackFileGid = this[gidSymbol](unpackFileEntry);
          typeof unpackFileUid == "number" &&
            typeof unpackFileGid == "number" &&
            unpackFs.fchown(
              unpackFileFd,
              unpackFileUid,
              unpackFileGid,
              (unpackFileFchownError) =>
                unpackFileFchownError
                  ? unpackFs.chown(
                      unpackFileAbsolutePath,
                      unpackFileUid,
                      unpackFileGid,
                      (unpackFileChownError) =>
                        unpackFileMetadataDone(
                          unpackFileChownError && unpackFileFchownError,
                        ),
                    )
                  : unpackFileMetadataDone(),
            );
        }
        unpackFileMetadataDone();
      });
      let unpackFileInputStream =
        (this.transform && this.transform(unpackFileEntry)) || unpackFileEntry;
      unpackFileInputStream !== unpackFileEntry &&
        (unpackFileInputStream.on("error", (unpackFileTransformError) => {
          this[onErrorSymbol](unpackFileTransformError, unpackFileEntry),
            unpackFileDone();
        }),
        unpackFileEntry.pipe(unpackFileInputStream)),
        unpackFileInputStream.pipe(unpackFileWriteStream);
    }
    [unpackDirectorySymbol](unpackDirectoryEntry, unpackDirectoryDone) {
      let unpackDirectoryMode =
        typeof unpackDirectoryEntry.mode == "number"
          ? unpackDirectoryEntry.mode & 4095
          : this.dmode;
      this[mkdirSymbol](
        String(unpackDirectoryEntry.absolute),
        unpackDirectoryMode,
        (unpackDirectoryMkdirError) => {
          if (unpackDirectoryMkdirError) {
            this[onErrorSymbol](
              unpackDirectoryMkdirError,
              unpackDirectoryEntry,
            ),
              unpackDirectoryDone();
            return;
          }
          let unpackDirectoryPendingOps = 1,
            unpackDirectoryMetadataDone = () => {
              --unpackDirectoryPendingOps === 0 &&
                (unpackDirectoryDone(),
                this[unpendSymbol](),
                unpackDirectoryEntry.resume());
            };
          unpackDirectoryEntry.mtime &&
            !this.noMtime &&
            (unpackDirectoryPendingOps++,
            unpackFs.utimes(
              String(unpackDirectoryEntry.absolute),
              unpackDirectoryEntry.atime || new Date(),
              unpackDirectoryEntry.mtime,
              unpackDirectoryMetadataDone,
            )),
            this[doChownSymbol](unpackDirectoryEntry) &&
              (unpackDirectoryPendingOps++,
              unpackFs.chown(
                String(unpackDirectoryEntry.absolute),
                Number(this[uidSymbol](unpackDirectoryEntry)),
                Number(this[gidSymbol](unpackDirectoryEntry)),
                unpackDirectoryMetadataDone,
              )),
            unpackDirectoryMetadataDone();
        },
      );
    }
    [unsupportedSymbol](unpackUnsupportedEntry) {
      (unpackUnsupportedEntry.unsupported = true),
        this.warn(
          "TAR_ENTRY_UNSUPPORTED",
          "unsupported entry type: " + unpackUnsupportedEntry.type,
          { entry: unpackUnsupportedEntry },
        ),
        unpackUnsupportedEntry.resume();
    }
    [unpackSymlinkSymbol](unpackSymlinkEntry, unpackSymlinkDone) {
      let unpackSymlinkRelativeSegments = normalizeTarPath(
        unpackPath.relative(
          this.cwd,
          unpackPath.resolve(
            unpackPath.dirname(String(unpackSymlinkEntry.absolute)),
            String(unpackSymlinkEntry.linkpath),
          ),
        ),
      ).split("/");
      this[ensureNoSymlinkSymbol](
        unpackSymlinkEntry,
        this.cwd,
        unpackSymlinkRelativeSegments,
        () =>
          this[linkSymbol](
            unpackSymlinkEntry,
            String(unpackSymlinkEntry.linkpath),
            "symlink",
            unpackSymlinkDone,
          ),
        (unpackSymlinkGuardError) => {
          this[onErrorSymbol](unpackSymlinkGuardError, unpackSymlinkEntry),
            unpackSymlinkDone();
        },
      );
    }
    [unpackHardlinkSymbol](unpackHardlinkEntry, unpackHardlinkDone) {
      let unpackHardlinkTargetPath = normalizeTarPath(
          unpackPath.resolve(this.cwd, String(unpackHardlinkEntry.linkpath)),
        ),
        unpackHardlinkTargetSegments = normalizeTarPath(
          String(unpackHardlinkEntry.linkpath),
        ).split("/");
      this[ensureNoSymlinkSymbol](
        unpackHardlinkEntry,
        this.cwd,
        unpackHardlinkTargetSegments,
        () =>
          this[linkSymbol](
            unpackHardlinkEntry,
            unpackHardlinkTargetPath,
            "link",
            unpackHardlinkDone,
          ),
        (unpackHardlinkGuardError) => {
          this[onErrorSymbol](unpackHardlinkGuardError, unpackHardlinkEntry),
            unpackHardlinkDone();
        },
      );
    }
    [ensureNoSymlinkSymbol](
      unpackGuardEntry,
      unpackGuardBasePath,
      unpackGuardSegments,
      unpackGuardPass,
      unpackGuardFail,
    ) {
      let unpackGuardSegment = unpackGuardSegments.shift();
      if (this.preservePaths || unpackGuardSegment === void 0)
        return unpackGuardPass();
      let unpackGuardNextPath = unpackPath.resolve(
        unpackGuardBasePath,
        unpackGuardSegment,
      );
      unpackFs.lstat(
        unpackGuardNextPath,
        (unpackGuardLstatError, unpackGuardStat) => {
          if (unpackGuardLstatError) return unpackGuardPass();
          if (unpackGuardStat?.isSymbolicLink())
            return unpackGuardFail(
              new SymlinkError(
                unpackGuardNextPath,
                unpackPath.resolve(
                  unpackGuardNextPath,
                  unpackGuardSegments.join("/"),
                ),
              ),
            );
          this[ensureNoSymlinkSymbol](
            unpackGuardEntry,
            unpackGuardNextPath,
            unpackGuardSegments,
            unpackGuardPass,
            unpackGuardFail,
          );
        },
      );
    }
    [pendSymbol]() {
      this[pendingSymbol]++;
    }
    [unpendSymbol]() {
      this[pendingSymbol]--, this[maybeCloseSymbol]();
    }
    [skipSymbol](unpackSkipEntry) {
      this[unpendSymbol](), unpackSkipEntry.resume();
    }
    [isReusableSymbol](unpackReusableEntry, unpackReusableStat) {
      return (
        unpackReusableEntry.type === "File" &&
        !this.unlink &&
        unpackReusableStat.isFile() &&
        unpackReusableStat.nlink <= 1 &&
        !isTarExtractWin32
      );
    }
    [checkFsSymbol](unpackCheckFsEntry) {
      this[pendSymbol]();
      let unpackReservationPaths = [unpackCheckFsEntry.path];
      unpackCheckFsEntry.linkpath &&
        unpackReservationPaths.push(unpackCheckFsEntry.linkpath),
        this.reservations.reserve(
          unpackReservationPaths,
          (unpackReservationRelease) =>
            this[checkFs2Symbol](unpackCheckFsEntry, unpackReservationRelease),
        );
    }
    [checkFs2Symbol](unpackFsCheckEntry, unpackFsReleaseReservation) {
      let unpackFsDone = (unpackFsDoneError) => {
          unpackFsReleaseReservation(unpackFsDoneError);
        },
        unpackEnsureCwd = () => {
          this[mkdirSymbol](this.cwd, this.dmode, (unpackEnsureCwdError) => {
            if (unpackEnsureCwdError) {
              this[onErrorSymbol](unpackEnsureCwdError, unpackFsCheckEntry),
                unpackFsDone();
              return;
            }
            (this[checkedCwdSymbol] = true), unpackEnsureParentDirectory();
          });
        },
        unpackEnsureParentDirectory = () => {
          if (unpackFsCheckEntry.absolute !== this.cwd) {
            let unpackParentDirectoryPath = normalizeTarPath(
              unpackPath.dirname(String(unpackFsCheckEntry.absolute)),
            );
            if (unpackParentDirectoryPath !== this.cwd)
              return this[mkdirSymbol](
                unpackParentDirectoryPath,
                this.dmode,
                (unpackParentDirectoryError) => {
                  if (unpackParentDirectoryError) {
                    this[onErrorSymbol](
                      unpackParentDirectoryError,
                      unpackFsCheckEntry,
                    ),
                      unpackFsDone();
                    return;
                  }
                  unpackInspectExistingPath();
                },
              );
          }
          unpackInspectExistingPath();
        },
        unpackInspectExistingPath = () => {
          unpackFs.lstat(
            String(unpackFsCheckEntry.absolute),
            (unpackExistingLstatError, unpackExistingStat) => {
              if (
                unpackExistingStat &&
                (this.keep ||
                  (this.newer &&
                    unpackExistingStat.mtime >
                      (unpackFsCheckEntry.mtime ?? unpackExistingStat.mtime)))
              ) {
                this[skipSymbol](unpackFsCheckEntry), unpackFsDone();
                return;
              }
              if (
                unpackExistingLstatError ||
                this[isReusableSymbol](unpackFsCheckEntry, unpackExistingStat)
              )
                return this[makeFsSymbol](
                  null,
                  unpackFsCheckEntry,
                  unpackFsDone,
                );
              if (unpackExistingStat.isDirectory()) {
                if (unpackFsCheckEntry.type === "Directory") {
                  let unpackDirectoryNeedsChmod =
                      this.chmod &&
                      unpackFsCheckEntry.mode &&
                      (unpackExistingStat.mode & 4095) !==
                        unpackFsCheckEntry.mode,
                    unpackDirectoryReuseDone = (unpackDirectoryReuseError) =>
                      this[makeFsSymbol](
                        unpackDirectoryReuseError ?? null,
                        unpackFsCheckEntry,
                        unpackFsDone,
                      );
                  return unpackDirectoryNeedsChmod
                    ? unpackFs.chmod(
                        String(unpackFsCheckEntry.absolute),
                        Number(unpackFsCheckEntry.mode),
                        unpackDirectoryReuseDone,
                      )
                    : unpackDirectoryReuseDone();
                }
                if (unpackFsCheckEntry.absolute !== this.cwd)
                  return unpackFs.rmdir(
                    String(unpackFsCheckEntry.absolute),
                    (unpackRmdirError) =>
                      this[makeFsSymbol](
                        unpackRmdirError ?? null,
                        unpackFsCheckEntry,
                        unpackFsDone,
                      ),
                  );
              }
              if (unpackFsCheckEntry.absolute === this.cwd)
                return this[makeFsSymbol](
                  null,
                  unpackFsCheckEntry,
                  unpackFsDone,
                );
              unlinkFileAsync(
                String(unpackFsCheckEntry.absolute),
                (unpackUnlinkError) =>
                  this[makeFsSymbol](
                    unpackUnlinkError ?? null,
                    unpackFsCheckEntry,
                    unpackFsDone,
                  ),
              );
            },
          );
        };
      this[checkedCwdSymbol]
        ? unpackEnsureParentDirectory()
        : unpackEnsureCwd();
    }
    [makeFsSymbol](unpackMakeFsError, unpackMakeFsEntry, unpackMakeFsDone) {
      if (unpackMakeFsError) {
        this[onErrorSymbol](unpackMakeFsError, unpackMakeFsEntry),
          unpackMakeFsDone();
        return;
      }
      switch (unpackMakeFsEntry.type) {
        case "File":
        case "OldFile":
        case "ContiguousFile":
          return this[unpackFileSymbol](unpackMakeFsEntry, unpackMakeFsDone);
        case "Link":
          return this[unpackHardlinkSymbol](
            unpackMakeFsEntry,
            unpackMakeFsDone,
          );
        case "SymbolicLink":
          return this[unpackSymlinkSymbol](unpackMakeFsEntry, unpackMakeFsDone);
        case "Directory":
        case "GNUDumpDir":
          return this[unpackDirectorySymbol](
            unpackMakeFsEntry,
            unpackMakeFsDone,
          );
      }
    }
    [linkSymbol](
      unpackLinkEntry,
      unpackLinkTarget,
      unpackLinkMethod,
      unpackLinkDone,
    ) {
      unpackFs[unpackLinkMethod](
        unpackLinkTarget,
        String(unpackLinkEntry.absolute),
        (unpackLinkError) => {
          unpackLinkError
            ? this[onErrorSymbol](unpackLinkError, unpackLinkEntry)
            : (this[unpendSymbol](), unpackLinkEntry.resume()),
            unpackLinkDone();
        },
      );
    }
  },
  trySyncTuple = (syncTupleThunk) => {
    try {
      return [null, syncTupleThunk()];
    } catch (syncTupleError) {
      return [syncTupleError, null];
    }
  },
  UnpackSync = class extends Unpack {
    sync = true;
    [makeFsSymbol](unpackSyncMakeFsError, unpackSyncMakeFsEntry) {
      return super[makeFsSymbol](
        unpackSyncMakeFsError,
        unpackSyncMakeFsEntry,
        () => {},
      );
    }
    [checkFsSymbol](unpackSyncFsCheckEntry) {
      if (!this[checkedCwdSymbol]) {
        let unpackSyncCwdMkdirError = this[mkdirSymbol](this.cwd, this.dmode);
        if (unpackSyncCwdMkdirError)
          return this[onErrorSymbol](
            unpackSyncCwdMkdirError,
            unpackSyncFsCheckEntry,
          );
        this[checkedCwdSymbol] = true;
      }
      if (unpackSyncFsCheckEntry.absolute !== this.cwd) {
        let unpackSyncParentDirectoryPath = normalizeTarPath(
          unpackPath.dirname(String(unpackSyncFsCheckEntry.absolute)),
        );
        if (unpackSyncParentDirectoryPath !== this.cwd) {
          let unpackSyncParentDirectoryError = this[mkdirSymbol](
            unpackSyncParentDirectoryPath,
            this.dmode,
          );
          if (unpackSyncParentDirectoryError)
            return this[onErrorSymbol](
              unpackSyncParentDirectoryError,
              unpackSyncFsCheckEntry,
            );
        }
      }
      let [unpackSyncExistingLstatError, unpackSyncExistingStat] = trySyncTuple(
        () => unpackFs.lstatSync(String(unpackSyncFsCheckEntry.absolute)),
      );
      if (
        unpackSyncExistingStat &&
        (this.keep ||
          (this.newer &&
            unpackSyncExistingStat.mtime >
              (unpackSyncFsCheckEntry.mtime ?? unpackSyncExistingStat.mtime)))
      )
        return this[skipSymbol](unpackSyncFsCheckEntry);
      if (
        unpackSyncExistingLstatError ||
        this[isReusableSymbol](unpackSyncFsCheckEntry, unpackSyncExistingStat)
      )
        return this[makeFsSymbol](null, unpackSyncFsCheckEntry);
      if (unpackSyncExistingStat.isDirectory()) {
        if (unpackSyncFsCheckEntry.type === "Directory") {
          let unpackSyncDirectoryNeedsChmod =
              this.chmod &&
              unpackSyncFsCheckEntry.mode &&
              (unpackSyncExistingStat.mode & 4095) !==
                unpackSyncFsCheckEntry.mode,
            [unpackSyncDirectoryChmodError] = unpackSyncDirectoryNeedsChmod
              ? trySyncTuple(() => {
                  unpackFs.chmodSync(
                    String(unpackSyncFsCheckEntry.absolute),
                    Number(unpackSyncFsCheckEntry.mode),
                  );
                })
              : [];
          return this[makeFsSymbol](
            unpackSyncDirectoryChmodError,
            unpackSyncFsCheckEntry,
          );
        }
        let [unpackSyncRmdirError] = trySyncTuple(() =>
          unpackFs.rmdirSync(String(unpackSyncFsCheckEntry.absolute)),
        );
        this[makeFsSymbol](unpackSyncRmdirError, unpackSyncFsCheckEntry);
      }
      let [unpackSyncUnlinkError] =
        unpackSyncFsCheckEntry.absolute === this.cwd
          ? []
          : trySyncTuple(() =>
              unlinkFileSync(String(unpackSyncFsCheckEntry.absolute)),
            );
      this[makeFsSymbol](unpackSyncUnlinkError, unpackSyncFsCheckEntry);
    }
    [unpackFileSymbol](unpackSyncFileEntry, unpackSyncFileDone) {
      let unpackSyncFileMode =
          typeof unpackSyncFileEntry.mode == "number"
            ? unpackSyncFileEntry.mode & 4095
            : this.fmode,
        unpackSyncFileClose = (unpackSyncFilePendingError) => {
          let unpackSyncFileCloseError;
          try {
            unpackFs.closeSync(unpackSyncFileDescriptor);
          } catch (unpackSyncFileCloseCaughtError) {
            unpackSyncFileCloseError = unpackSyncFileCloseCaughtError;
          }
          (unpackSyncFilePendingError || unpackSyncFileCloseError) &&
            this[onErrorSymbol](
              unpackSyncFilePendingError || unpackSyncFileCloseError,
              unpackSyncFileEntry,
            ),
            unpackSyncFileDone();
        },
        unpackSyncFileDescriptor;
      try {
        unpackSyncFileDescriptor = unpackFs.openSync(
          String(unpackSyncFileEntry.absolute),
          selectTarWriteOpenFlags(unpackSyncFileEntry.size),
          unpackSyncFileMode,
        );
      } catch (unpackSyncFileOpenError) {
        return unpackSyncFileClose(unpackSyncFileOpenError);
      }
      let unpackSyncFileInputStream =
        (this.transform && this.transform(unpackSyncFileEntry)) ||
        unpackSyncFileEntry;
      unpackSyncFileInputStream !== unpackSyncFileEntry &&
        (unpackSyncFileInputStream.on("error", (unpackSyncFileTransformError) =>
          this[onErrorSymbol](
            unpackSyncFileTransformError,
            unpackSyncFileEntry,
          ),
        ),
        unpackSyncFileEntry.pipe(unpackSyncFileInputStream)),
        unpackSyncFileInputStream.on("data", (unpackSyncFileChunk) => {
          try {
            unpackFs.writeSync(
              unpackSyncFileDescriptor,
              unpackSyncFileChunk,
              0,
              unpackSyncFileChunk.length,
            );
          } catch (unpackSyncFileWriteError) {
            unpackSyncFileClose(unpackSyncFileWriteError);
          }
        }),
        unpackSyncFileInputStream.on("end", () => {
          let unpackSyncFileMetadataError = null;
          if (unpackSyncFileEntry.mtime && !this.noMtime) {
            let unpackSyncFileAtime = unpackSyncFileEntry.atime || new Date(),
              unpackSyncFileMtime = unpackSyncFileEntry.mtime;
            try {
              unpackFs.futimesSync(
                unpackSyncFileDescriptor,
                unpackSyncFileAtime,
                unpackSyncFileMtime,
              );
            } catch (unpackSyncFileFutimesError) {
              try {
                unpackFs.utimesSync(
                  String(unpackSyncFileEntry.absolute),
                  unpackSyncFileAtime,
                  unpackSyncFileMtime,
                );
              } catch {
                unpackSyncFileMetadataError = unpackSyncFileFutimesError;
              }
            }
          }
          if (this[doChownSymbol](unpackSyncFileEntry)) {
            let unpackSyncFileUid = this[uidSymbol](unpackSyncFileEntry),
              unpackSyncFileGid = this[gidSymbol](unpackSyncFileEntry);
            try {
              unpackFs.fchownSync(
                unpackSyncFileDescriptor,
                Number(unpackSyncFileUid),
                Number(unpackSyncFileGid),
              );
            } catch (unpackSyncFileFchownError) {
              try {
                unpackFs.chownSync(
                  String(unpackSyncFileEntry.absolute),
                  Number(unpackSyncFileUid),
                  Number(unpackSyncFileGid),
                );
              } catch {
                unpackSyncFileMetadataError =
                  unpackSyncFileMetadataError || unpackSyncFileFchownError;
              }
            }
          }
          unpackSyncFileClose(unpackSyncFileMetadataError);
        });
    }
    [unpackDirectorySymbol](unpackSyncDirectoryEntry, unpackSyncDirectoryDone) {
      let unpackSyncDirectoryMode =
          typeof unpackSyncDirectoryEntry.mode == "number"
            ? unpackSyncDirectoryEntry.mode & 4095
            : this.dmode,
        unpackSyncDirectoryMkdirError = this[mkdirSymbol](
          String(unpackSyncDirectoryEntry.absolute),
          unpackSyncDirectoryMode,
        );
      if (unpackSyncDirectoryMkdirError) {
        this[onErrorSymbol](
          unpackSyncDirectoryMkdirError,
          unpackSyncDirectoryEntry,
        ),
          unpackSyncDirectoryDone();
        return;
      }
      if (unpackSyncDirectoryEntry.mtime && !this.noMtime)
        try {
          unpackFs.utimesSync(
            String(unpackSyncDirectoryEntry.absolute),
            unpackSyncDirectoryEntry.atime || new Date(),
            unpackSyncDirectoryEntry.mtime,
          );
        } catch {}
      if (this[doChownSymbol](unpackSyncDirectoryEntry))
        try {
          unpackFs.chownSync(
            String(unpackSyncDirectoryEntry.absolute),
            Number(this[uidSymbol](unpackSyncDirectoryEntry)),
            Number(this[gidSymbol](unpackSyncDirectoryEntry)),
          );
        } catch {}
      unpackSyncDirectoryDone(), unpackSyncDirectoryEntry.resume();
    }
    [mkdirSymbol](unpackSyncMkdirPath, unpackSyncMkdirMode) {
      try {
        return mkdirSync(normalizeTarPath(unpackSyncMkdirPath), {
          uid: this.uid,
          gid: this.gid,
          processUid: this.processUid,
          processGid: this.processGid,
          umask: this.processUmask,
          preserve: this.preservePaths,
          unlink: this.unlink,
          cwd: this.cwd,
          mode: unpackSyncMkdirMode,
        });
      } catch (unpackSyncMkdirError) {
        return unpackSyncMkdirError;
      }
    }
    [ensureNoSymlinkSymbol](
      unpackSyncGuardEntry,
      unpackSyncGuardBasePath,
      unpackSyncGuardSegments,
      unpackSyncGuardPass,
      unpackSyncGuardFail,
    ) {
      if (this.preservePaths || unpackSyncGuardSegments.length === 0)
        return unpackSyncGuardPass();
      let unpackSyncGuardCurrentPath = unpackSyncGuardBasePath;
      for (let unpackSyncGuardSegment of unpackSyncGuardSegments) {
        unpackSyncGuardCurrentPath = unpackPath.resolve(
          unpackSyncGuardCurrentPath,
          unpackSyncGuardSegment,
        );
        let [unpackSyncGuardLstatError, unpackSyncGuardStat] = trySyncTuple(
          () => unpackFs.lstatSync(unpackSyncGuardCurrentPath),
        );
        if (unpackSyncGuardLstatError) return unpackSyncGuardPass();
        if (unpackSyncGuardStat.isSymbolicLink())
          return unpackSyncGuardFail(
            new SymlinkError(
              unpackSyncGuardCurrentPath,
              unpackPath.resolve(
                unpackSyncGuardBasePath,
                unpackSyncGuardSegments.join("/"),
              ),
            ),
          );
      }
      unpackSyncGuardPass();
    }
    [linkSymbol](
      unpackSyncLinkEntry,
      unpackSyncLinkTarget,
      unpackSyncLinkMethod,
      unpackSyncLinkDone,
    ) {
      let unpackSyncLinkMethodName = unpackSyncLinkMethod + "Sync";
      try {
        unpackFs[unpackSyncLinkMethodName](
          unpackSyncLinkTarget,
          String(unpackSyncLinkEntry.absolute),
        ),
          unpackSyncLinkDone(),
          unpackSyncLinkEntry.resume();
      } catch (unpackSyncLinkError) {
        return this[onErrorSymbol](unpackSyncLinkError, unpackSyncLinkEntry);
      }
    }
  },
  unpackFileSync = (unpackFileSyncOptions) => {
    let unpackFileSyncStream = new UnpackSync(unpackFileSyncOptions),
      unpackFileSyncPath = unpackFileSyncOptions.file,
      unpackFileSyncStat = unpackFileFs.statSync(unpackFileSyncPath),
      unpackFileSyncReadSize = unpackFileSyncOptions.maxReadSize || 16777216;
    new ReadStreamSync(unpackFileSyncPath, {
      readSize: unpackFileSyncReadSize,
      size: unpackFileSyncStat.size,
    }).pipe(unpackFileSyncStream);
  },
  unpackFileAsync = (unpackFileAsyncOptions, unpackFileAsyncPaths) => {
    let unpackFileAsyncStream = new Unpack(unpackFileAsyncOptions),
      unpackFileAsyncReadSize = unpackFileAsyncOptions.maxReadSize || 16777216,
      unpackFileAsyncPath = unpackFileAsyncOptions.file;
    return new Promise((unpackFileResolve, unpackFileReject) => {
      unpackFileAsyncStream.on("error", unpackFileReject),
        unpackFileAsyncStream.on("close", unpackFileResolve),
        unpackFileFs.stat(
          unpackFileAsyncPath,
          (unpackFileStatError, unpackFileStat) => {
            if (unpackFileStatError) unpackFileReject(unpackFileStatError);
            else {
              let unpackFileReadStream = new ReadStream(unpackFileAsyncPath, {
                readSize: unpackFileAsyncReadSize,
                size: unpackFileStat.size,
              });
              unpackFileReadStream.on("error", unpackFileReject),
                unpackFileReadStream.pipe(unpackFileAsyncStream);
            }
          },
        );
    });
  },
  tarExtract = createTarFacade(
    unpackFileSync,
    unpackFileAsync,
    (tarExtractSyncStreamOptions) =>
      new UnpackSync(tarExtractSyncStreamOptions),
    (tarExtractAsyncStreamOptions) => new Unpack(tarExtractAsyncStreamOptions),
    (tarExtractFacadeOptions, tarExtractFacadePaths) => {
      tarExtractFacadePaths?.length &&
        applyPathFilter(tarExtractFacadeOptions, tarExtractFacadePaths);
    },
  ),
  replaceTarFileSync = (tarReplaceSyncOptions, tarReplaceSyncPaths) => {
    let tarReplaceSyncPack = new PackSync(tarReplaceSyncOptions),
      shouldCloseTarReplaceFd = true,
      tarReplaceFd,
      tarReplaceAppendOffset;
    try {
      try {
        tarReplaceFd = replaceFs.openSync(tarReplaceSyncOptions.file, "r+");
      } catch (tarReplaceOpenError) {
        if (tarReplaceOpenError?.code === "ENOENT")
          tarReplaceFd = replaceFs.openSync(tarReplaceSyncOptions.file, "w+");
        else throw tarReplaceOpenError;
      }
      let tarReplaceFileStat = replaceFs.fstatSync(tarReplaceFd),
        tarReplaceHeaderBlock = Buffer.alloc(512);
      tarReplaceHeaderScanLoop: for (
        tarReplaceAppendOffset = 0;
        tarReplaceAppendOffset < tarReplaceFileStat.size;
        tarReplaceAppendOffset += 512
      ) {
        for (
          let tarHeaderReadOffset = 0, tarHeaderBytesRead = 0;
          tarHeaderReadOffset < 512;
          tarHeaderReadOffset += tarHeaderBytesRead
        ) {
          if (
            ((tarHeaderBytesRead = replaceFs.readSync(
              tarReplaceFd,
              tarReplaceHeaderBlock,
              tarHeaderReadOffset,
              tarReplaceHeaderBlock.length - tarHeaderReadOffset,
              tarReplaceAppendOffset + tarHeaderReadOffset,
            )),
            tarReplaceAppendOffset === 0 &&
              tarReplaceHeaderBlock[0] === 31 &&
              tarReplaceHeaderBlock[1] === 139)
          )
            throw Error("cannot append to compressed archives");
          if (!tarHeaderBytesRead) break tarReplaceHeaderScanLoop;
        }
        let tarReplaceExistingHeader = new TarHeader(tarReplaceHeaderBlock);
        if (!tarReplaceExistingHeader.cksumValid) break;
        let tarReplaceEntryBodySize =
          512 * Math.ceil((tarReplaceExistingHeader.size || 0) / 512);
        if (
          tarReplaceAppendOffset + tarReplaceEntryBodySize + 512 >
          tarReplaceFileStat.size
        )
          break;
        (tarReplaceAppendOffset += tarReplaceEntryBodySize),
          tarReplaceSyncOptions.mtimeCache &&
            tarReplaceExistingHeader.mtime &&
            tarReplaceSyncOptions.mtimeCache.set(
              String(tarReplaceExistingHeader.path),
              tarReplaceExistingHeader.mtime,
            );
      }
      (shouldCloseTarReplaceFd = false),
        appendReplaceTarSync(
          tarReplaceSyncOptions,
          tarReplaceSyncPack,
          tarReplaceAppendOffset,
          tarReplaceFd,
          tarReplaceSyncPaths,
        );
    } finally {
      if (shouldCloseTarReplaceFd)
        try {
          replaceFs.closeSync(tarReplaceFd);
        } catch {}
    }
  },
  appendReplaceTarSync = (
    appendTarOptions,
    appendTarPackStream,
    appendTarStartOffset,
    appendTarFd,
    appendTarPaths,
  ) => {
    let appendTarWriteStream = new WriteStreamSync(appendTarOptions.file, {
      fd: appendTarFd,
      start: appendTarStartOffset,
    });
    appendTarPackStream.pipe(appendTarWriteStream),
      addTarReplacePathsSync(appendTarPackStream, appendTarPaths);
  },
  replaceTarFileAsync = (tarReplaceAsyncOptions, tarReplaceAsyncPaths) => {
    tarReplaceAsyncPaths = Array.from(tarReplaceAsyncPaths);
    let tarReplaceAsyncPack = new Pack(tarReplaceAsyncOptions),
      findTarAppendOffsetAsync = (
        tarReplaceAsyncFd,
        tarReplaceAsyncFileSize,
        tarAppendOffsetCallback,
      ) => {
        let finishTarAppendOffsetScan = (
            tarAppendScanError,
            tarAppendScanOffset,
          ) => {
            tarAppendScanError
              ? replaceFs.close(tarReplaceAsyncFd, (closeAfterScanError) =>
                  tarAppendOffsetCallback(tarAppendScanError),
                )
              : tarAppendOffsetCallback(null, tarAppendScanOffset);
          },
          asyncTarAppendOffset = 0;
        if (tarReplaceAsyncFileSize === 0)
          return finishTarAppendOffsetScan(null, 0);
        let asyncTarHeaderBytesRead = 0,
          asyncTarHeaderBlock = Buffer.alloc(512),
          onTarHeaderRead = (tarHeaderReadError, tarHeaderReadBytes) => {
            if (tarHeaderReadError || tarHeaderReadBytes === void 0)
              return finishTarAppendOffsetScan(tarHeaderReadError);
            if (
              ((asyncTarHeaderBytesRead += tarHeaderReadBytes),
              asyncTarHeaderBytesRead < 512 && tarHeaderReadBytes)
            )
              return replaceFs.read(
                tarReplaceAsyncFd,
                asyncTarHeaderBlock,
                asyncTarHeaderBytesRead,
                asyncTarHeaderBlock.length - asyncTarHeaderBytesRead,
                asyncTarAppendOffset + asyncTarHeaderBytesRead,
                onTarHeaderRead,
              );
            if (
              asyncTarAppendOffset === 0 &&
              asyncTarHeaderBlock[0] === 31 &&
              asyncTarHeaderBlock[1] === 139
            )
              return finishTarAppendOffsetScan(
                Error("cannot append to compressed archives"),
              );
            if (asyncTarHeaderBytesRead < 512)
              return finishTarAppendOffsetScan(null, asyncTarAppendOffset);
            let asyncTarExistingHeader = new TarHeader(asyncTarHeaderBlock);
            if (!asyncTarExistingHeader.cksumValid)
              return finishTarAppendOffsetScan(null, asyncTarAppendOffset);
            let asyncTarEntryBodySize =
              512 * Math.ceil((asyncTarExistingHeader.size ?? 0) / 512);
            if (
              asyncTarAppendOffset + asyncTarEntryBodySize + 512 >
                tarReplaceAsyncFileSize ||
              ((asyncTarAppendOffset += asyncTarEntryBodySize + 512),
              asyncTarAppendOffset >= tarReplaceAsyncFileSize)
            )
              return finishTarAppendOffsetScan(null, asyncTarAppendOffset);
            tarReplaceAsyncOptions.mtimeCache &&
              asyncTarExistingHeader.mtime &&
              tarReplaceAsyncOptions.mtimeCache.set(
                String(asyncTarExistingHeader.path),
                asyncTarExistingHeader.mtime,
              ),
              (asyncTarHeaderBytesRead = 0),
              replaceFs.read(
                tarReplaceAsyncFd,
                asyncTarHeaderBlock,
                0,
                512,
                asyncTarAppendOffset,
                onTarHeaderRead,
              );
          };
        replaceFs.read(
          tarReplaceAsyncFd,
          asyncTarHeaderBlock,
          0,
          512,
          asyncTarAppendOffset,
          onTarHeaderRead,
        );
      };
    return new Promise((resolveTarReplaceAsync, rejectTarReplaceAsync) => {
      tarReplaceAsyncPack.on("error", rejectTarReplaceAsync);
      let tarReplaceOpenFlags = "r+",
        onTarReplaceOpen = (
          tarReplaceOpenAsyncError,
          tarReplaceAsyncOpenedFd,
        ) => {
          if (
            tarReplaceOpenAsyncError &&
            tarReplaceOpenAsyncError.code === "ENOENT" &&
            tarReplaceOpenFlags === "r+"
          )
            return (
              (tarReplaceOpenFlags = "w+"),
              replaceFs.open(
                tarReplaceAsyncOptions.file,
                tarReplaceOpenFlags,
                onTarReplaceOpen,
              )
            );
          if (tarReplaceOpenAsyncError || !tarReplaceAsyncOpenedFd)
            return rejectTarReplaceAsync(tarReplaceOpenAsyncError);
          replaceFs.fstat(
            tarReplaceAsyncOpenedFd,
            (tarReplaceFstatError, tarReplaceAsyncStat) => {
              if (tarReplaceFstatError)
                return replaceFs.close(tarReplaceAsyncOpenedFd, () =>
                  rejectTarReplaceAsync(tarReplaceFstatError),
                );
              findTarAppendOffsetAsync(
                tarReplaceAsyncOpenedFd,
                tarReplaceAsyncStat.size,
                (tarAppendOffsetError, tarAppendStartOffset) => {
                  if (tarAppendOffsetError)
                    return rejectTarReplaceAsync(tarAppendOffsetError);
                  let tarReplaceAsyncWriteStream = new WriteStream(
                    tarReplaceAsyncOptions.file,
                    {
                      fd: tarReplaceAsyncOpenedFd,
                      start: tarAppendStartOffset,
                    },
                  );
                  tarReplaceAsyncPack.pipe(tarReplaceAsyncWriteStream),
                    tarReplaceAsyncWriteStream.on(
                      "error",
                      rejectTarReplaceAsync,
                    ),
                    tarReplaceAsyncWriteStream.on(
                      "close",
                      resolveTarReplaceAsync,
                    ),
                    addTarReplacePathsAsync(
                      tarReplaceAsyncPack,
                      tarReplaceAsyncPaths,
                    );
                },
              );
            },
          );
        };
      replaceFs.open(
        tarReplaceAsyncOptions.file,
        tarReplaceOpenFlags,
        onTarReplaceOpen,
      );
    });
  },
  addTarReplacePathsSync = (tarReplaceSyncAddPack, tarReplaceSyncPathList) => {
    tarReplaceSyncPathList.forEach((tarReplaceSyncPathSpec) => {
      tarReplaceSyncPathSpec.charAt(0) === "@"
        ? tarList({
            file: replacePath.resolve(
              tarReplaceSyncAddPack.cwd,
              tarReplaceSyncPathSpec.slice(1),
            ),
            sync: true,
            noResume: true,
            onReadEntry: (tarListedSyncEntry) =>
              tarReplaceSyncAddPack.add(tarListedSyncEntry),
          })
        : tarReplaceSyncAddPack.add(tarReplaceSyncPathSpec);
    }),
      tarReplaceSyncAddPack.end();
  },
  addTarReplacePathsAsync = async (
    tarReplaceAsyncPackStream,
    tarReplaceAsyncPathList,
  ) => {
    for (let tarReplaceAsyncPathSpec of tarReplaceAsyncPathList)
      tarReplaceAsyncPathSpec.charAt(0) === "@"
        ? await tarList({
            file: replacePath.resolve(
              String(tarReplaceAsyncPackStream.cwd),
              tarReplaceAsyncPathSpec.slice(1),
            ),
            noResume: true,
            onReadEntry: (tarListedAsyncEntry) =>
              tarReplaceAsyncPackStream.add(tarListedAsyncEntry),
          })
        : tarReplaceAsyncPackStream.add(tarReplaceAsyncPathSpec);
    tarReplaceAsyncPackStream.end();
  },
  tarReplace = createTarFacade(
    replaceTarFileSync,
    replaceTarFileAsync,
    () => {
      throw TypeError("file is required");
    },
    () => {
      throw TypeError("file is required");
    },
    (tarReplaceValidateOptions, tarReplaceValidatePaths) => {
      if (!hasFileOption(tarReplaceValidateOptions))
        throw TypeError("file is required");
      if (
        tarReplaceValidateOptions.gzip ||
        tarReplaceValidateOptions.brotli ||
        tarReplaceValidateOptions.zstd ||
        tarReplaceValidateOptions.file.endsWith(".br") ||
        tarReplaceValidateOptions.file.endsWith(".tbr")
      )
        throw TypeError("cannot append to compressed archives");
      if (!tarReplaceValidatePaths?.length)
        throw TypeError("no paths specified to add/replace");
    },
  ),
  tarUpdate = createTarFacade(
    tarReplace.syncFile,
    tarReplace.asyncFile,
    tarReplace.syncNoFile,
    tarReplace.asyncNoFile,
    (tarUpdateOptions, tarUpdatePaths = []) => {
      tarReplace.validate?.(tarUpdateOptions, tarUpdatePaths),
        applyTarUpdateFilter(tarUpdateOptions);
    },
  ),
  applyTarUpdateFilter = (tarUpdateFilterOptions) => {
    let originalTarUpdateFilter = tarUpdateFilterOptions.filter;
    tarUpdateFilterOptions.mtimeCache ||
      (tarUpdateFilterOptions.mtimeCache = new Map()),
      (tarUpdateFilterOptions.filter = originalTarUpdateFilter
        ? (tarUpdateFilterPath, tarUpdateFilterEntry) =>
            originalTarUpdateFilter(
              tarUpdateFilterPath,
              tarUpdateFilterEntry,
            ) &&
            !(
              (tarUpdateFilterOptions.mtimeCache?.get(tarUpdateFilterPath) ??
                tarUpdateFilterEntry.mtime ??
                0) > (tarUpdateFilterEntry.mtime ?? 0)
            )
        : (tarUpdateDefaultPath, tarUpdateDefaultEntry) =>
            !(
              (tarUpdateFilterOptions.mtimeCache?.get(tarUpdateDefaultPath) ??
                tarUpdateDefaultEntry.mtime ??
                0) > (tarUpdateDefaultEntry.mtime ?? 0)
            ));
  };
