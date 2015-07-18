'use strict';

/**
 * LinkedStateMixin
 */
module.exports = {

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
	linkState: function (statePath) {
		var state = this.state,
			parts = statePath.split('.'),
			namespace = parts.shift(),
			value = state,
			getNewValuePath = undefined;

		parts.forEach(function (piece) {
			value = value[piece];
		});


		// this function returns the reconstructed object
		// e.g. if the statePath was 'formValues.someInputGroup.input1'
		// when that input (input1) changes to 'SomeNewValue', this function will return the
		// following object:
		// 	{
		// 		formValues: {
		// 			someInputGroup: {
		// 				input1: 'SomeNewValue'
		// 			}
		// 		}
		// 	}
		getNewValuePath = function (newVal) {
			var constructedObj = {},
				internalPtr;

			constructedObj[namespace] = state[namespace] || {};

			// if the value should be placed right in component's
			// state, then just set the value and return
			if (parts.length === 0) {
				constructedObj[namespace] = newVal;
				return constructedObj;
			}

			internalPtr = constructedObj[namespace];

			parts.forEach(function (piece, pieceIndex) {
				// if it's the last piece
				if (pieceIndex === parts.length - 1) {
					internalPtr[piece] = newVal;
					return;
				}

				// mutate the constructedObj via
				// internalPtr object
				internalPtr[piece] = internalPtr[piece] || {};
				internalPtr = internalPtr[piece];
			});

			return constructedObj;
		};

		// returns an object of type ReactLink -> which contains
		// {
		// 		value: the current input value,
		// 		requestChange: the onChange function to run
		// }
		return {
			value: value,
			requestChange: function (newVal) {
				this.setState(getNewValuePath(newVal));
			}.bind(this),
		}
	}
};