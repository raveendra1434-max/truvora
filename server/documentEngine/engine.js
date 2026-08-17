import DocumentSchema from "./core/DocumentSchema.js";

export default class DocumentEngine {

    constructor() {
        this.document = new DocumentSchema();
    }

    createDocument() {
        this.document = new DocumentSchema();
        return this;
    }

    setTitle(title) {
        this.document.title = title;
        return this;
    }

    setSubtitle(subtitle) {
        this.document.subtitle = subtitle;
        return this;
    }

    setAuthor(author) {
        this.document.author = author;
        return this;
    }

    setCompany(company) {
        this.document.company = company;
        return this;
    }

    setDepartment(department) {
        this.document.department = department;
        return this;
    }

    setCategory(category) {
        this.document.category = category;
        return this;
    }

    setLanguage(language) {
        this.document.language = language;
        return this;
    }

    addSection(title, content) {
        this.document.sections.push({
            title,
            content
        });
        return this;
    }

    addTable(table) {
        this.document.tables.push(table);
        return this;
    }

    addImage(image) {
        this.document.images.push(image);
        return this;
    }

    addChart(chart) {
        this.document.charts.push(chart);
        return this;
    }

    addReference(reference) {
        this.document.references.push(reference);
        return this;
    }

    getDocument() {
        return this.document;
    }
}