sap.ui.define([
    "sap/ui/core/Element"
], function (
    Element
) {
    "use strict";

    const RangeConfig = Element.extend("Control.xml.valuehelpInput.RangeConfig", {
        metadata: {
            properties: {
                /**
                 * Can be used as input for subsequent actions.
                 */
                key: { type: "string", defaultValue: null },
                /**
                 * The text to be displayed for the item.
                 */
                label: { type: "string", defaultValue: "" },

                /**
                 * data type of the column (text, numeric or date is supported)
                 */
                type: { type: "string", defaultValue: "text" },

                /**
                 * data type instance of the column. Can be used instead of the type, precision, scale and formatSettings properties
                 *
                 * @since 1.56
                 */
                typeInstance: { type: "object", defaultValue: null },

                /**
                 * if type==numeric the precision will be used to format the entered value (maxIntegerDigits of the used Formatter)
                 */
                precision: { type: "string", defaultValue: null },

                /**
                 * A JSON object containing the formatSettings which will be used to pass additional type/format settings for the entered value.
                 * if type==time or date or datetime the object will be used for the DateFormatter, TimeFormatter or DateTimeFormatter
                 *
                 *<i>Below you can find a brief example</i>
                 *
                 * <pre><code>
                 * {
                 *		UTC: false,
                 * 		style: "medium" //"short" or "long"
                 * }
                 * </code></pre>
                 *
                 * @since 1.52
                 */
                formatSettings: { type: "object", defaultValue: null },

                /**
                 * if type==numeric the scale will be used to format the entered value (maxFractionDigits of the used Formatter)
                 */
                scale: { type: "string", defaultValue: null },

                /**
                 * specifies the number of characters which can be entered in the value fields of the condition panel
                 */
                maxLength: { type: "string", defaultValue: null },

                /**
                 * the column with isDefault==true will be used as the selected column item on the conditionPanel
                 */
                isDefault: { type: "boolean", defaultValue: false },

                /**
                 * Defines if the item is nullable
                 */
                nullable: { type: "boolean", defaultValue: false }
            }
        }
    });

    RangeConfig.prototype._getRangeConfig = function () {
        const oProperties = {};
        oProperties.key = this.getKey();
        oProperties.label = this.getLabel();
        oProperties.isDefault = this.getIsDefault();
        oProperties.nullable = this.getNullable();
        oProperties.type = this.getType();
        oProperties.typeInstance = this.getTypeInstance();
        oProperties.precision = this.getPrecision();
        oProperties.scale = this.getScale();
        oProperties.formatSettings = this.getFormatSettings()
        oProperties.maxLength = this.getMaxLength()

        return oProperties;
    }

    return RangeConfig;
});