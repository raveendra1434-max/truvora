export default class TocGenerator {

    static generate(document) {

        document.toc = document.sections.map((section, index) => ({
            number: index + 1,
            title: section.title,
            page: section.page || 1
        }));

        return document;

    }

}