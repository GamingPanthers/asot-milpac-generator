declare module 'pngjs' {
  class PNG {
    constructor(options: { width: number; height: number; colorType?: number });
    data: Buffer;
    width: number;
    height: number;
    pack(): any;
  }

  export = PNG;
}
