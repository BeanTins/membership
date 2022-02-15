export class HttpResponse{
    static created(item: string){
      return {
        statusCode: 201,
        body: JSON.stringify({
          message: item + " created"
        }) 
      }
    }
    static error(error: any, statusCodeMap : Map<any, number>){
      
      let statusCode = 500
  
      for (let [key, value] of statusCodeMap) {
        if (error instanceof key)
        {
          statusCode = value
        }
      }
  
      return {
        statusCode: statusCode,
        body: JSON.stringify({
          message: error.message
        }) 
      }
    }
}
  