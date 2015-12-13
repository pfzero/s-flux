export interface ILinkedState {
    value: any;
    requestChange: {
        (newVal: any): void;
    };
}
/**
 * linkState() returns an object of type ReactLink. It has
 * the following schema:
 * 		{
 * 			value: '', // the current value of the input
 * 			requestChange: fn() {} // the function that is called
 * 								   // every time the input's value changes;
 * 								   // this function should update the component's state
 * 		}
 * 	The usage of this returned object is to link the component's state to the input's value
 *
 * @example
 * 		linkState('formValues.someInputGroup.input1') ->
 * 		returns an object of type ReactLink which will link the input's value to the
 * 		following state path: this.state.formValues.someInputGroup.input1
 *
 * @param  <String> statePath the path in the state object containing the input's value
 * @return <Object>
 */
export declare function linkState(statePath: string): ILinkedState;
