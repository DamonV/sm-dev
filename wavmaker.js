var Wav = function(params){
    this._sampleRate = params && params.sampleRate ? params.sampleRate : 11025;
    this._channels = params && params.channels ? params.channels : 1;
    this._bytes = params && params.bytes ? params.bytes : 1;
};

Wav.prototype.makeWav = function(buffer){
    var riff = new Uint8Array(44), tmp;
    const len=buffer.length + 36;
    const byteRate=this._channels*this._sampleRate*this._bytes;

    riff[0] = 0x52; // "R"
    riff[1] = 0x49; // "I"
    riff[2] = 0x46; // "F"
    riff[3] = 0x46; // "F"

    // RIFF size
    riff[4] = len & 0x000000ff;
    riff[5] = (len & 0x0000ff00) >> 8;
    riff[6] = (len & 0x00ff0000) >> 16;
    riff[7] = (len & 0xff000000) >> 24;

    riff[8] = 0x57; // "WA"
    riff[9] = 0x41;
    riff[10] = 0x56; // "VE"
    riff[11] = 0x45;

    riff[12] = 0x66; // "fm"
    riff[13] = 0x6d;
    riff[14] = 0x74; // "t "
    riff[15] = 0x20;

    //16
    riff[16] = 0x10;
    riff[17] = 0x00;
    riff[18] = 0x00;
    riff[19] = 0x00;

    //PCM=1
    riff[20] = 0x01;
    riff[21] = 0x00;

    //channels
    riff[22] = this._channels;
    riff[23] = 0x00;

    //sample rate
    riff[24] = this._sampleRate & 0x000000ff;
    riff[25] = (this._sampleRate & 0x0000ff00) >> 8;
    riff[26] = (this._sampleRate & 0x00ff0000) >> 16;
    riff[27] = (this._sampleRate & 0xff000000) >> 24;

    //byteRate
    riff[28] = byteRate & 0x000000ff;
    riff[29] = (byteRate & 0x0000ff00) >> 8;
    riff[30] = (byteRate & 0x00ff0000) >> 16;
    riff[31] = (byteRate & 0xff000000) >> 24;

    //blockAlign
    riff[32] = this._bytes*this._channels;
    riff[33] = 0x00;

    // bit per sample
    riff[34] = this._bytes << 3;
    riff[35] = 0x00;

    riff[36] = 0x64; // "d"
    riff[37] = 0x61; // "a"
    riff[38] = 0x74; // "t"
    riff[39] = 0x61; // "a"

    riff[40] = buffer.length & 0x000000ff;
    riff[41] = (buffer.length & 0x0000ff00) >> 8;
    riff[42] = (buffer.length & 0x00ff0000) >> 16;
    riff[43] = (buffer.length & 0xff000000) >> 24;

    riffbuf=Buffer.from(riff);
    return Buffer.concat([riffbuf, buffer]);
};

exports.wavMaker = Wav;