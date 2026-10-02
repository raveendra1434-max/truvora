import DocumentEngine from "./engine.js";
import DocumentFormatter from "./formatter.js";
import MetadataManager from "./metadata.js";
import Branding from "./branding.js";
import DocumentValidator from "./validator.js";
import TemplateEngine from "./template.js";
import TocGenerator from "./tocGenerator.js";

export function createEnterpriseDocument(title) {

    const engine = new DocumentEngine();

    engine.createDocument();

    engine.setTitle(title);

    let document = engine.getDocument();

    document = Branding.apply(document);

    document = MetadataManager.apply(document);

    document = TocGenerator.generate(document);

    DocumentValidator.validate(document);

    document = TemplateEngine.build(document);

    document = DocumentFormatter.format(document);

    return document;

}