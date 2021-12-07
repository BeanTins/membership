

import {readFileSync} from "fs"
import got from "got"
import logger from "./logger"
import * as path from "path"

export async function signupMember(name: string | null, email: string | null)
{
    let responseBody: any = {}
    let requestBody: any = {}
    requestBody.name = name

    if (email) {
        requestBody.email = email
    }

    try{
        logger.verbose(path.join(__dirname, "awsDeploy.json"))

        const deployOutputs = JSON.parse(readFileSync(path.join(__dirname, "../../../awsDeploy.json"), "utf8"))

        const url = deployOutputs.MemberSignupStack.endpoint

        logger.verbose("Signup member at url - " + url)

        responseBody = await got.post(url, {json: requestBody})

        logger.verbose("Signup member response - " + responseBody.statusCode)
        logger.verbose("Signup member response - " + responseBody.body)
    }
    catch(error)
    {
        logger.verbose("Error from signup member request - " + JSON.stringify(error))
    }

    return responseBody
}

