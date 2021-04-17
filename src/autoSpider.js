// TODO web版爬虫实现
var target = [{
        selector: '.ad_name .ad_id',
        name: '',
        action: 'findAll -> text'
    },
    {
        selector: '#adHeaderContainer > div > .ad-header-container > .tags-container > .ad-tag:nth-child(2)',
        name: '计划ID',
        action: 'text'

    }, {
        selector: '.ad-header-container > div > .product-item > .info > .id',
        name: '商品ID',
        action: 'text'

    }, {
        selector: '.drawer-content > div > .ad-drawer-tabs > .tabs > .tab:nth-child(4)',
        name: '投放设置',
        action: 'click'

    },
    {
        selector: '.tab-container > .delivery-tab > .data-card:nth-child(2) > .setting-item:nth-child(2) > .display-value',
        name: '地域',
        action: 'text'
    },
    {
        selector: '.tab-container > .delivery-tab > .data-card:nth-child(3) > .setting-item:nth-child(6) > .display-value',
        name: '创意分类',
        action: 'text'
    },
    {
        selector: '.tab-container > .delivery-tab > .data-card > .setting-item:nth-child(21) > .display-value',
        name: '预估用户覆盖',
        action: 'text'
    },
    {
        selector: '.tab-container > .delivery-tab > .data-card:nth-child(3) > .setting-item:nth-child(7) > .display-value',
        name: '创意标签',
        action: 'text'
    }
];

const sleep = m => new Promise(r => setTimeout(r, m));

async function batch(target = [], time = 3000) {

    let nts = [...target];
    for (const t of nts) {
        t.result = doAction(t.selector, t.action);
        await sleep(time);
    }
    // console.log(nts)
    return nts
};

function findAll(s, action) {
    let nodes = document.querySelectorAll(s);
    let result = [];
    if (nodes) {
        for (const node of nodes) {
            console.log(action)
            result.push(doAction(node, action));
        }
    }
    return result;
}

function doAction(selector, action) {
    console.log(action.match('findall'))
    let result;
    if (action === 'text') {
        result = text(selector);
    } else if (action === 'click') {
        result = click(selector);
    } else if (action.match('findall')) {
        let actions = Array.from(action.split('->'), s => s.trim());

        result = findAll(selector, actions[1])
    }
    return result
}

function text(s) {
    if (typeof(s) === 'object') {
        return s.innerText;
    } else if (typeof(s) === 'string') {
        if (document.querySelector(s)) return document.querySelector(s).innerText;
    }

};

function click(s) {
    if (typeof(s) === 'object') {
        return s.click();
    } else if (typeof(s) === 'string') {
        document.querySelector(s).click();
        return true;
    };
    return false;
}