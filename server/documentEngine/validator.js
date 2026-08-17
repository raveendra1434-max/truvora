export default class DocumentValidator {

    static validate(document) {

        if (!document.title)
            throw new Error("Document title is required.");

        if (!document.sections.length)
            throw new Error("Document must contain at least one section.");

        return true;

    }

}