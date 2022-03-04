import {readFileSync, readdirSync} from "fs"
import * as path from "path"
import logger from "./logger"

export function resolveOutput(stackName: string, outputName: string)
{
    var output: string | undefined

    const outputFileList = readdirSync(path.join(__dirname, "../../..")).filter(fn => fn.endsWith("_outputs.json"))

    if (outputFileList.length > 0)
    {
        for (const outputFile of outputFileList)
        {
            const deployOutputs = JSON.parse(readFileSync(outputFile).toString())

            const outputList = deployOutputs[stackName]

            if (outputList != undefined)
            {
                output = outputList[outputName]
                if (output != undefined)
                {
                    break
                }
            }
        }
    }
    else 
    {
        output = process.env[outputName]
    }

    logger.verbose("output - " + output)

    if (output == undefined)
    {
        throw Error(outputName + " undefined")
    }

    return output
}

