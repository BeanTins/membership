import {readFileSync, existsSync} from "fs"
import got from "got"
import logger from "./logger"
import * as path from "path"

function retrieveEndpoint()
{
    var endpoint: string | undefined
    const deployOutputsFile: string = path.join(__dirname, "../../../awsDeploy.json")

    if (existsSync(deployOutputsFile))
    {
        const deployOutputs = JSON.parse(readFileSync(deployOutputsFile).toString())
        endpoint = deployOutputs["MembershipDevStage-MemberSignup"].endpoint
    }
    else 
    {
        endpoint = process.env.memberSignupEndpoint
    }

    if (endpoint == undefined)
    {
        throw Error("signup url undefined")
    }

    return endpoint
}

export async function signupMember(name: string | null, email: string | null)
{
    let responseBody: any = {}
    let requestBody: any = {}
    requestBody.name = name

    if (email) {
        requestBody.email = email
    }

    try{
        const url = retrieveEndpoint()

        logger.verbose("member signup url - " + url)

        responseBody = await got.post(url, {json: requestBody})

        logger.verbose("member signup response statusCode:" + 
                        responseBody.statusCode + 
                        ", body: " + 
                        responseBody.body)
    }
    catch(error)
    {
        logger.verbose("Error from signup member request - " + JSON.stringify(error))
    }

    return responseBody
}

