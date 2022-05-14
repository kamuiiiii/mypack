declare type ID = string;
export interface IDependency {
    path: string;
    async: boolean;
}
export interface IAsset {
    dependencies: Array<IDependency>;
    code: string;
    id: ID;
    mapping: {
        [propName: string]: ID;
    };
    reload?: boolean;
}
export declare type IGraph = Array<IAsset>;
export {};
