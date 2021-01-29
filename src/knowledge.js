class Knowledge {
    constructor(readme, course, knowledge) {
        this.readOnly = true;
        this.course = course;
        this.readme = readme;

        knowledge = JSON.parse(knowledge || "{}");
        this.readmeHtml = knowledge.readme || '';
        this.courseHtml = knowledge.course || '';
        this.init();

        this.toggle(true);

    }
    init() {
        this.courseHtml ? this.course.innerHTML = this.courseHtml : null;
        this.readmeHtml ? this.readme.innerHTML = this.readmeHtml : null;
    }
    get() {
        this.courseHtml = this.course.innerHTML;
        this.readmeHtml = this.readme.innerHTML;
        return {
            course: this.courseHtml,
            readme: this.readmeHtml
        };
    }
    set(json) {
        this.courseHtml = json.course;
        this.readmeHtml = json.readme;
        this.init();
    }
    toggle(readOnly) {
        if (readOnly !== undefined && readOnly !== null) {
            this.readOnly = readOnly;
        } else {
            this.readOnly = !this.readOnly;
        }
        // console.log(this.readOnly)
        if (this.readOnly) {
            this.course.removeAttribute('contenteditable');
            this.readme.removeAttribute('contenteditable');
            this.readme.classList.add("readme-show");
            this.course.classList.add("course-show");
            //this.course.blur();
        } else {
            // this.course.style.outline='0.5px dotted green';
            this.course.setAttribute('contenteditable', true);
            this.readme.setAttribute('contenteditable', true);
            this.readme.classList.remove("readme-show");
            this.course.classList.remove("course-show");
        };
        return this.readOnly
    }
}

module.exports = Knowledge;