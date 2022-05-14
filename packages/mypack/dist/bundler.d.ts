import { IAsset, IGraph } from "./bundler.interface";
declare class Bundler {
    assetMap: Map<string, IAsset>;
    config: {
        entry: string;
        output: string;
        filename: string;
        port: number;
    };
    constructor({ entry, output, filename, port }: {
        entry: any;
        output: any;
        filename: any;
        port?: number;
    });
    createAsset(id: string): Promise<IAsset>;
    getOrCreateAsset(id: string, options?: {
        async: boolean;
    }): Promise<IAsset>;
    createGraph(entry: string): Promise<Array<IGraph>>;
    generateModules(graph: IGraph): string;
    generateModule(asset: IAsset): string;
    bundleInitialChunk: (graph: IGraph) => string;
    bundleNonInitialChunk(graph: IGraph): string;
    bundleUpdateChunk(asset: IAsset): Promise<string>;
    update(updateEntry: string): Promise<void>;
    build(): Promise<void>;
    rebuild(id: string): Promise<void>;
}
export default Bundler;
