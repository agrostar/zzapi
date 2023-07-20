const fs = require('fs');
const YAML = require('yaml');
const util = require('util')

function getRequestPositions(document) {
    const lineCounter = new YAML.LineCounter();

    const parsed = YAML.parseDocument(document, { lineCounter });

    const ret = { all: {}, each: [] };
    if (!YAML.isMap(parsed.contents)) return ret;

    parsed.contents.items.forEach(topLevelItem => {
        if (topLevelItem.key.value !== 'requests') return;
        if (!YAML.isMap(topLevelItem.value)) return;

        const [start, end ] = topLevelItem.key.range;
        // Do we need the end position? lineCounter is expected tobe inefficient as it does 
        // a search among the lines. The lesser we call it the better.
        ret.all = [lineCounter.linePos(start), lineCounter.linePos(end)];

        topLevelItem.value.items.forEach(request => {
            const name = request.key.value;
            const [start, end] = request.key.range;
            ret.each.push({name, range: [lineCounter.linePos(start), lineCounter.linePos(end)]});
        });
    });
    return ret;
}

const document = fs.readFileSync('tests-alt.zz-bundle.yaml', 'utf-8');
const { all, each } = getRequestPositions(document);
console.log(util.inspect(all, {depth: null}));
console.log(util.inspect(each, {depth: null}));

/* output: 
[
  {
    name: 'simple-get',
    range: [ { line: 26, col: 3 }, { line: 26, col: 13 } ]
  },
  {
    name: 'get-with-params',
    range: [ { line: 28, col: 3 }, { line: 28, col: 18 } ]
  },
  {
    name: 'post-header-merge',
    range: [ { line: 39, col: 3 }, { line: 39, col: 20 } ]
  },
  {
    name: 'post-header-override',
    range: [ { line: 56, col: 3 }, { line: 56, col: 23 } ]
  },
  {
    name: 'status-404',
    range: [ { line: 66, col: 3 }, { line: 66, col: 13 } ]
  },
  {
    name: 'status-401',
    range: [ { line: 72, col: 3 }, { line: 72, col: 13 } ]
  },
  {
    name: 'encoding',
    range: [ { line: 80, col: 3 }, { line: 80, col: 11 } ]
  },
  {
    name: 'no-encoding',
    range: [ { line: 90, col: 3 }, { line: 90, col: 14 } ]
  },
  {
    name: 'no-redirects',
    range: [ { line: 101, col: 3 }, { line: 101, col: 15 } ]
  },
  {
    name: 'redirects',
    range: [ { line: 110, col: 3 }, { line: 110, col: 12 } ]
  },
  {
    name: 'non-json',
    range: [ { line: 120, col: 3 }, { line: 120, col: 11 } ]
  },
  {
    name: 'response-headers',
    range: [ { line: 126, col: 3 }, { line: 126, col: 19 } ]
  },
  {
    name: 'override-base-url',
    range: [ { line: 135, col: 3 }, { line: 135, col: 20 } ]
  },
  {
    name: 'variables-in-params',
    range: [ { line: 139, col: 3 }, { line: 139, col: 22 } ]
  },
  {
    name: 'variables-in-headers',
    range: [ { line: 156, col: 3 }, { line: 156, col: 23 } ]
  },
  {
    name: 'variables-in-body',
    range: [ { line: 165, col: 3 }, { line: 165, col: 20 } ]
  }
]
*/