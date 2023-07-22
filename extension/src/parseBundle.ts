import * as YAML from "yaml";

export interface RequestPosition {
    name?: string;
    start: { line: number; col: number };
    end: { line: number; col: number };
}

/*
 * Returns an array of requestPosition objects. If the name of a
 * requestPosition is null or undefined, it is the "all requests" position.
 * All other requestPositions will have a name and a position.
 */
export function getRequestPositions(document: string): Array<RequestPosition> {
    let positions: Array<RequestPosition> = [];

    const lineCounter = new YAML.LineCounter();
    let doc = YAML.parseDocument(document, { lineCounter });

    if (!YAML.isMap(doc.contents)) {
        return positions;
    }
    let contents = doc.contents as YAML.YAMLMap;

    contents.items.forEach((topLevelItem) => {
        if (!YAML.isMap(topLevelItem.value)) {
            return;
        }
        let key = topLevelItem.key as YAML.Scalar;
        if (key.value !== "requests") {
            return;
        }

        const start = key.range?.[0] as number;
        const end = key.range?.[1] as number;
        const all: RequestPosition = {
            start: lineCounter.linePos(start),
            end: lineCounter.linePos(end),
        };
        positions.push(all);

        let requests = topLevelItem.value as YAML.YAMLMap;
        requests.items.forEach((request) => {
            if (!YAML.isMap(request.value)) {
                return;
            }
            let key = request.key as YAML.Scalar;
            const name = key.value as string;
            const start = key.range?.[0] as number;
            const end = key.range?.[1] as number;
            const each: RequestPosition = {
                name: name,
                start: lineCounter.linePos(start),
                end: lineCounter.linePos(end),
            };
            positions.push(each);
        });
    });

    return positions;
}

// function test() {
//     const yamlString = `
//     common:
//       debug: false
//     requests:
//       request1:
//         method: GET
//       request2:
//         method: POST
//     `;
//     const rps = getRequestPositions(yamlString);
//     rps.forEach((rp) => {
//         console.log(
//             `${rp.name}: start: ${rp.start.line} ${rp.start.col}, end: ${rp.end.line} ${rp.end.col}`
//         );
//     });
// }

// test();
