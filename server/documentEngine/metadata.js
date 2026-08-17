export default class MetadataManager {

    static apply(document) {

        document.metadata.createdAt = new Date().toISOString();
        document.metadata.updatedAt = new Date().toISOString();
        document.metadata.generator = "Truvora Global AI";
        document.metadata.version = "1.0.0";

        return document;

    }

}