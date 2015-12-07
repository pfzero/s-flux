
module constants {

    export interface IAppErrorDescription {
        error: string;
        status: number;
        summary: string;
    }

    export interface IAppError {
        [errorKey: string]: IAppErrorDescription;
    }

    export const errors: IAppError = {
        "E_NOT_FOUND": {
            error: 'E_NOT_FOUND',
            status: 404,
            summary: 'No record found'
        },
        "E_BAD_REQUEST": {
            error: 'E_BAD_REQUEST',
            status: 400,
            summary: 'Bad request'
        },
        "E_INTERNAL": {
            error: 'E_INTERNAL',
            status: 500,
            summary: 'Internal server error'
        },
        "E_UNKNOWN": {
            error: 'E_UNKNOWN',
            status: 0,
            summary: 'Unknown error'
        }
    };


    export interface IActionType {
        [k: string]: string
    }
    
    /**
     * getActionConstants returns the 4 type of actions that will
     * dispatch for every action
     * @example
     *     let constants = this.getActionConstants("create");
     *     console.log(constants);
     *     // will print:
     *     {
     *       base: "USERS_CREATE",
     *       success: "USERS_CREATE_SUCCESS",
     *       error: "USERS_CREATE_ERROR",
     *       complete: "USERS_CREATE_COMPLETE"
     *     }
     *
     * @param  {String} type Action type
     * @return {Object}
     */
    export function getActionConstants(resourceName: string, type: string) {
        const upperRsc: string = resourceName.toUpperCase(), upperType = type.toUpperCase();

        return {
            base: `${upperRsc}_${upperType}`,
            success: `${upperRsc}_${upperType}_SUCCESS`,
            error: `${upperRsc}_${upperType}_ERROR`,
            complete: `${upperRsc}_${upperType}_COMPLETE`
        };
    };
}
