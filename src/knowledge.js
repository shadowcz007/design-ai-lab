const marked = require("marked");
// const html = marked('# Marked in Node.js\n\nRendered by **marked**.');
// const mermaid = require('mermaid/dist/mermaid');
// var renderer = new marked.Renderer();
// renderer.code = function(code, language) {
//     if (code.match(/^sequenceDiagram/) || code.match(/^graph/)) {
//         return '<div class="mermaid">' + code + '</div>';
//     } else {
//         return '<pre><code>' + code + '</code></pre>';
//     }
// };

// console.log(renderer)
class Knowledge {
    init(readme, course, author, version) {
        this.readOnly = false;
        this.course = course;
        this.readme = readme;
        this.author = author;
        this.version = version;
        // this.imports = imports;

        this.initDataAndDom();
        this.toggle(this.readOnly);

        this.marked = marked;
    }
    initDataAndDom() {
        this.initDataAndDomByKey('readme');
        this.initDataAndDomByKey('course');
        this.initDataAndDomByKey('author');
        this.initDataAndDomByKey('version');
        // this.initDataAndDomByKey('imports');
    }

    initDataAndDomByKey(key = 'author') {
        if (this[key] != null) {
            let knowledge = localStorage.getItem("knowledge");
            if (!knowledge||(knowledge&&!knowledge.match("{"))) knowledge = "{}";
            knowledge = JSON.parse(knowledge);

            this[key].setAttribute('data-md', knowledge[key] || '');

            if (key === 'course') {
                this[key].innerHTML = marked(this[key].getAttribute('data-md'))
            } else {
                this[key].value = this[key].getAttribute('data-md');
            };

            // 缓存
            this[key].addEventListener("input", e => {
                e.preventDefault();
                if (key === 'course') {
                    this[key].setAttribute('data-md', this[key].innerText);
                } else {
                    this[key].setAttribute('data-md', this[key].value);
                };
                localStorage.setItem("knowledge", JSON.stringify(this.get()));
            });
        };
    }

    set(json) {
        localStorage.setItem("knowledge", JSON.stringify(json));
        this.initDataAndDom();
        this.toggle(false);
    }
    get() {
        // let title = this.readme.getAttribute('data-md');
        return {
            // title: title,
            course: this.course.getAttribute('data-md'),
            readme: this.readme.getAttribute('data-md'),
            author: this.author.getAttribute('data-md'),
            version: this.version.getAttribute('data-md'),
            // imports: JSON.parse(this.imports.getAttribute('data-md'))
        };
    }

    toggle(readOnly = null) {
        // console.log(readOnly)
        if (readOnly !== null) {
            this.readOnly = readOnly;
        } else {
            this.readOnly = !this.readOnly;
        }
        if (!(this.course && this.readme)) return this.readOnly;
        if (this.readOnly) {
            this.course.removeAttribute('contenteditable');
            this.readme.value = this.readme.getAttribute('data-md');
            this.author.value = this.author.getAttribute('data-md');
            this.version.value = this.version.getAttribute('data-md');
            this.course.innerHTML = marked(this.course.getAttribute('data-md'));
        } else {
            this.course.setAttribute('contenteditable', true);
            this.readme.value = this.readme.getAttribute('data-md');
            this.author.value = this.author.getAttribute('data-md');
            this.version.value = this.version.getAttribute('data-md');
            this.course.innerText = this.course.getAttribute('data-md');
        };
        return this.readOnly
    }

}

module.exports = new Knowledge();