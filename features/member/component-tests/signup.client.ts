import got from "got"
import logger from "./logger"
import {resolveOutput} from "./output-resolver"

export async function signupMember(name: string | null, email: string | null)
{
    let responseBody: any = {}
    let requestBody: any = {}

    if (name) {
        requestBody.name = name
    }

    if (email) {
        requestBody.email = email
    }

    try{
        const url = resolveOutput("MembershipDevStage-MemberSignup", "MemberSignupEndpoint")

        logger.verbose("member signup url - " + url)

        logger.verbose("request body - " + JSON.stringify(requestBody))

        responseBody = await got.post(url, {json: requestBody, throwHttpErrors: false})

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

