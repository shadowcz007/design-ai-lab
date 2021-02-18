const marked = require("marked");
// const html = marked('# Marked in Node.js\n\nRendered by **marked**.');
const mermaid = require('mermaid/dist/mermaid');
var renderer = new marked.Renderer();
renderer.code = function(code, language) {
    if (code.match(/^sequenceDiagram/) || code.match(/^graph/)) {
        return '<div class="mermaid">' + code + '</div>';
    } else {
        return '<pre><code>' + code + '</code></pre>';
    }
};

// console.log(renderer)
class Knowledge {
    init(readme, course) {
        this.readOnly = true;
        this.course = course;
        this.readme = readme;

        this.initDataAndDom();
        this.toggle(true);

        this.marked = marked;
    }
    initDataAndDom() {

        let knowledge = JSON.parse(localStorage.getItem("knowledge") || "{}");

        if (this.readme != null) {
            this.readme.setAttribute('data-md', knowledge.readme || '');
            this.readme.innerHTML = marked(this.readme.getAttribute('data-md'));
            // 缓存
            this.readme.addEventListener("input", e => {
                e.preventDefault();
                this.readme.setAttribute('data-md', this.readme.innerText);
                localStorage.setItem("knowledge", JSON.stringify(this.get()));
            });
        }
        if (this.course != null) {
            this.course.setAttribute('data-md', knowledge.course || '');
            this.course.innerHTML = marked(this.course.getAttribute('data-md'));
            // 缓存
            this.course.addEventListener("input", e => {
                e.preventDefault();
                this.course.setAttribute('data-md', this.course.innerText);
                localStorage.setItem("knowledge", JSON.stringify(this.get()));
            });
        };

        // 只粘贴text
        if (this.readme && this.course) {
            // this.readme.addEventListener('paste', e => {
            //     e.preventDefault();
            //     let text = e.clipboardData.getData('text');
            //     e.target.insertAdjacentText('beforeend', text);
            //     // console.log(e.target)
            // });
            // this.course.addEventListener('paste', e => {
            //     e.preventDefault();
            //     let text = e.clipboardData.getData('text');
            //     e.target.insertAdjacentText('beforeend', text);
            // })
        }
    }
    set(json) {
        localStorage.setItem("knowledge", JSON.stringify(json));
        this.initDataAndDom();
        this.toggle(true);
    }
    get() {
        let div = document.createElement('div');
        div.innerHTML = marked(this.readme.getAttribute('data-md'));
        let title = '';
        if (div.children && div.children[0]) title = div.children[0].innerText;
        return {
            title: title,
            course: this.course.getAttribute('data-md'),
            readme: this.readme.getAttribute('data-md')
        };
    }

    toggle(readOnly = null) {
        // console.log(readOnly)
        if (readOnly !== null) {
            this.readOnly = readOnly;
        } else {
            this.readOnly = !this.readOnly;
        }
        // console.log(this.readOnly)
        if (!(this.course && this.readme)) return this.readOnly;
        // console.log(this.readOnly)
        if (this.readOnly) {
            this.course.removeAttribute('contenteditable');
            this.readme.removeAttribute('contenteditable');
            this.readme.classList.add("readme-show");
            this.course.classList.add("course-show");

            // this.readme.setAttribute('data-md', this.readme.innerText);
            // this.course.setAttribute('data-md', this.course.innerText);
            this.readme.innerHTML = marked(this.readme.getAttribute('data-md'));;
            this.course.innerHTML = marked(this.course.getAttribute('data-md'));;
            //this.course.blur();
        } else {
            // this.course.style.outline='0.5px dotted green';
            this.course.setAttribute('contenteditable', true);
            this.readme.setAttribute('contenteditable', true);
            this.readme.classList.remove("readme-show");
            this.course.classList.remove("course-show");

            this.readme.innerText = this.readme.getAttribute('data-md');
            this.course.innerText = this.course.getAttribute('data-md')

        };
        return this.readOnly
    }

}

module.exports = new Knowledge();