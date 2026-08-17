export default class TemplateEngine {

    static build(document) {

        return {
            title: document.title,
            subtitle: document.subtitle,
            content: document.sections,
            tables: document.tables,
            charts: document.charts,
            images: document.images,
            references: document.references,
            headers: document.headers,
            footers: document.footers,
            metadata: document.metadata,
            brand: document.brand,
            styles: document.styles
        };

    }

}