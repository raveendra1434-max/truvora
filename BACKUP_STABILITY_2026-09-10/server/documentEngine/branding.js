export default class Branding {

    static apply(document) {

        document.brand = {
            company: "Truvora Global AI Technologies",
            product: "Truvora Global AI",
            slogan: "Intelligence • Innovation • Trust",
            website: "https://truvora.ai",
            copyright:
                `© ${new Date().getFullYear()} Truvora Global AI Technologies`
        };

        return document;

    }

}