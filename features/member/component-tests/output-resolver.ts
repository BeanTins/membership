import {readFileSync, existsSync} from "fs"
import * as path from "path"
import logger from "./logger"

export function resolveOutput(stackName: string, outputName: string)
{
    var output: string | undefined
    const deployOutputsFile: string = path.join(__dirname, "../../../awsDeploy.json")

    if (existsSync(deployOutputsFile))
    {
        const deployOutputs = JSON.parse(readFileSync(deployOutputsFile).toString())
        output = deployOutputs[stackName][outputName]
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

