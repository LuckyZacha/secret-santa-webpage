import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import { saveAs } from 'file-saver';
import JSZip, { forEach } from 'jszip';
import { getRules } from '../../state/rule/reducer'
import { getPersons } from '../../state/person/reducer';
import { RootState, AppDispatch } from '../../state/store'

const received = new Map<string, Boolean>();
const given = new Map<string, Boolean>();
const relation = new Map<string, string>();
let answer = new Map<string, string>();


const init = (persons: Array<{ id: string, name: string }>) => {
    for (const { name } of persons) {
        received.set(name, false);
        given.set(name, false);
        relation.set(name, '');
    }
}

const dfs = (persons: Array<{ id: string, name: string }>, maptogive: Map<string, Array<string>>) => {
    let allReceived = true;
    for (const { name } of persons) {
        if (received.get(name) == false) {
            allReceived = false;
            break;
        }
    }
    if (allReceived) {
        answer = JSON.parse(JSON.stringify(Array.from(relation)));
        return;
    }

    for (const { name: nameToGive } of persons) {
        if (given.get(nameToGive)) continue;

        for (const { name: nameToReceive } of persons) {
            if (received.get(nameToReceive)) continue;
            if (maptogive.get(nameToGive)?.includes(nameToReceive) && relation.get(nameToReceive) !== nameToGive) {
                received.set(nameToReceive, true);
                given.set(nameToGive, true);
                relation.set(nameToGive, nameToReceive);
                dfs(persons, maptogive);
                received.set(nameToReceive, false);
                given.set(nameToGive, false);
                relation.set(nameToGive, '');
            }
        }

    }
}

const DownloadPage = () => {
    const rules = useSelector(({ rule }: RootState) => getRules(rule.rules))
    const persons = useSelector(({ people }: RootState) => getPersons(people.persons))
    const downloadFile = () => {
        const zip = new JSZip()
        let map = new Map<string, Array<string>>();
        rules.map(({ firstPerson, secondPerson, isVerca }, index) => {
            let arr = map.get(firstPerson) as Array<string>
            if (!arr) arr = []
            arr.push(secondPerson)
            map.set(firstPerson, arr)
            if (isVerca) {
                arr = map.get(secondPerson) as Array<string>
                if (!arr) arr = []
                arr.push(firstPerson)
                map.set(secondPerson, arr)
            }
        })
        let maptogive = new Map<string, Array<string>>();
        for (const { name } of persons) {
            const relation = map.get(name) as Array<string> ?? []
            relation.push(name)
            const canGive = persons.filter((person) => {
                return !relation.includes(person.name)
            })
            let arr = maptogive.get(name) as Array<string>
            if (!arr) arr = []
            canGive.map(e => arr.push(e.name))
            maptogive.set(name, arr);
        }

        init(persons);
        dfs(persons, maptogive);
        // console.log('relation', answer, maptogive)
        if(!!answer.size) {

            answer.forEach(e => {
                const giver = e[0]
                const receiver = e[1]
                let result = giver + ", you are giving a present to " + receiver
                const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
                zip.file(`${giver}.txt`, blob);
            })
            zip.generateAsync({ type: "blob" }).then(function (content) {
                // see FileSaver.js
                saveAs(content, "secretsanta.zip");
            });
        } else {
            alert("No output, please make rules again")
        }

    }

    return (
        <div className='flex flex-col justify-center items-center text-blue-400'>
            <p className='text-xl'>Santa has finished deciding who everyone should give secret gifts to!</p>
            <Link href="/download">
                <button className='border rounded-lg bg-blue-400 text-white px-5 py-3 mt-10 items-center justify-center' onClick={downloadFile}>
                    Download SecretSanta.zip
                </button>
            </Link>
            <Link href="/">
                <button className='border rounded-lg bg-blue-400 text-white px-5 py-3 mt-10 items-center justify-center'>
                    Go back and start a new Secret Santa list
                </button>
            </Link>
        </div>
    )
}

export default DownloadPage