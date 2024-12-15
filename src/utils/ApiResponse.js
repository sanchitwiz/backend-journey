class ApiResponse{
    constructor(statusCode, data, message = "Sucess Message"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}
