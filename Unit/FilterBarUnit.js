/* eslint-disable camelcase */
/* eslint-disable radix */
/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-expressions */
/* eslint-disable complexity */
/* eslint-disable max-statements */
sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/core/date/UniversalDateUtils",
    "sap/ui/core/date/UniversalDate",
    "sap/ui/comp/config/condition/DateRangeType",
    "sap/ui/core/date/UI5Date"
], function (
    baseObject, UniversalDateUtils, UniversalDate, DateRangeType, UI5Date
) {
    "use strict";

    const FilterBarUnit = baseObject.extend("app.controller.Unit.FilterBarUnit", {
        metadata: {
            publicMethods: ["FilterBar_to_Filters", "Filters_form_Names"]
        }
    });

    const sCalendarType = null;

    const _getTodayFromToValueFrom = function (iValueFrom) {
        if (iValueFrom < 0) {
            var oValueFrom = UniversalDateUtils.getRange((-1 * iValueFrom), "DAY")[1];
            oValueFrom.setHours(0, 0, 0);
            return oValueFrom;
        }
        return UniversalDateUtils.getRange(-iValueFrom, "DAY")[0];
    };

    const _getTodayFromToValueTo = function (iValueTo) {
        if (iValueTo < 0) {
            var oValueTo = UniversalDateUtils.getRange(iValueTo, "DAY")[0];
            oValueTo.setHours(23, 59, 59);
            return oValueTo;
        }
        return UniversalDateUtils.getRange(iValueTo, "DAY")[1];
    };

    var aOperations = Object.assign(
        {
            FROMDATETIME: {
                key: "FROMDATETIME",
                type: "int",
                value1: null,
                defaultValues: [null]
            },
            TODATETIME: {
                key: "TODATETIME",
                type: "int",
                value1: null,
                defaultValues: [null]
            },
            SPECIFICMONTHINYEAR: {
                key: "SPECIFICMONTHINYEAR",
                type: "int",
                value1: null,
                value2: null,
                defaultValues: [null, null]
            }
        },
        DateRangeType.SingleOperations,
        DateRangeType.DTOffsetOperations
    );

    /**
     * DynamicDateRange转换为Filter
     * @param {string} key Filter的key
     * @param {sap.m.DynamicDateRange} control oDynamicDateRange.getValue()
     * @returns {sap.ui.model.Filter[]|undefined} Filter
     */
    FilterBarUnit.DDR_to_Filter = function (key, control) {
        var oCondition = control.getValue();
        var [value1, value2] = oCondition.values;
        var operator = oCondition.operator;
        oCondition = aOperations[oCondition.operator];
        oCondition.operator = operator;
        typeof oCondition.defaultValues === "function"
            ? [oCondition.value1, oCondition.value2] = oCondition.defaultValues()
            : [oCondition.value1, oCondition.value2] = [value1, value2];

        var aValues;

        if (oCondition.operator === "LASTMINUTES") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.lastMinutes(oCondition.value1);
            }
            aValues[0]?.setMilliseconds(0);
            aValues[0]?.setSeconds(0);
            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "LASTMINUTESINCLUDED") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.lastMinutes(oCondition.value1 - 1);
            }

            aValues[0]?.setMilliseconds(0);
            aValues[0]?.setSeconds(0);
            aValues[1]?.setSeconds(59);
            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "LASTHOURS") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.lastHours(oCondition.value1);
            }
            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "LASTHOURSINCLUDED") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.lastHours(oCondition.value1 - 1);
            }
            aValues[0]?.setMinutes(0);
            aValues[0]?.setMilliseconds(0);
            aValues[0]?.setSeconds(0);
            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "LASTDAYS") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.lastDays(oCondition.value1);
            }
            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "LASTDAYSINCLUDED") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.lastDays(oCondition.value1 - 1);
            }
            oCondition.value1 = aValues[0];
            oCondition.value2 = UniversalDate.getInstance(UI5Date.getInstance());
        } else if (oCondition.operator === "LASTWEEKS") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.lastWeeks(oCondition.value1);
            }
            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "LASTWEEKSINCLUDED") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.lastWeeks(oCondition.value1 - 1, sCalendarType);
            }
            oCondition.value1 = aValues[0];
            oCondition.value2 = UniversalDate.getInstance(UI5Date.getInstance());
        } else if (oCondition.operator === "LASTMONTHS") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.lastMonths(oCondition.value1);
            }
            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "LASTMONTHSINCLUDED") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.lastMonths(oCondition.value1 - 1);
            }
            oCondition.value1 = aValues[0];
            oCondition.value2 = UniversalDate.getInstance(UI5Date.getInstance());
        } else if (oCondition.operator === "LASTQUARTERS") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.lastQuarters(oCondition.value1);
            }
            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "LASTQUARTERSINCLUDED") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.lastQuarters(oCondition.value1 - 1);
            }
            oCondition.value1 = aValues[0];
            oCondition.value2 = UniversalDate.getInstance(UI5Date.getInstance());
        } else if (oCondition.operator === "LASTYEARS") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.lastYears(oCondition.value1);
            }
            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "LASTYEARSINCLUDED") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.lastYears(oCondition.value1 - 1);
            }
            oCondition.value1 = aValues[0];
            oCondition.value2 = UniversalDate.getInstance(UI5Date.getInstance());
        } else if (oCondition.operator === "NEXTMINUTES") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.nextMinutes(oCondition.value1);
            }

            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "NEXTMINUTESINCLUDED") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.nextMinutes(oCondition.value1 - 1);
            }

            aValues[0]?.setMilliseconds(0);
            aValues[0]?.setSeconds(0);
            aValues[1]?.setSeconds(59);
            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "NEXTHOURS") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.nextHours(oCondition.value1);
            }
            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "NEXTHOURSINCLUDED") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.nextHours(oCondition.value1 - 1);
            }
            aValues[1]?.setMinutes(59, 59);
            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "NEXTDAYS") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.nextDays(oCondition.value1);
            }
            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "NEXTDAYSINCLUDED") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.nextDays(oCondition.value1 - 1);
            }
            oCondition.value1 = UniversalDate.getInstance(UI5Date.getInstance());
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "NEXTWEEKS") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.nextWeeks(oCondition.value1);
            }
            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "NEXTWEEKSINCLUDED") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.nextWeeks(oCondition.value1 - 1, sCalendarType);
            }
            oCondition.value1 = UniversalDate.getInstance(UI5Date.getInstance());
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "NEXTMONTHS") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.nextMonths(oCondition.value1);
            }
            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "NEXTMONTHSINCLUDED") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.nextMonths(oCondition.value1 - 1);
            }
            oCondition.value1 = UniversalDate.getInstance(UI5Date.getInstance());
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "NEXTQUARTERS") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.nextQuarters(oCondition.value1);
            }
            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "NEXTQUARTERSINCLUDED") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.nextQuarters(oCondition.value1 - 1);
            }
            oCondition.value1 = UniversalDate.getInstance(UI5Date.getInstance());
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "NEXTYEARS") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.nextYears(oCondition.value1);
            }
            oCondition.value1 = aValues[0];
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "NEXTYEARSINCLUDED") {
            if (!isNaN(oCondition.value1)) {
                aValues = UniversalDateUtils.ranges.nextYears(oCondition.value1 - 1);
            }
            oCondition.value1 = UniversalDate.getInstance(UI5Date.getInstance());
            oCondition.value2 = aValues[1];
        } else if (oCondition.operator === "SPECIFICMONTH") {
            var iValue = parseInt(value1),
                oDate = new UniversalDate();

            if (Number.isFinite(iValue)) {
                oDate.setDate(1);
                oDate.setMonth(iValue);
                oDate = UniversalDateUtils.getMonthStartDate(oDate);
                aValues = UniversalDateUtils.getRange(0, "MONTH", oDate);
                oCondition.value1 = aValues[0];
                oCondition.value2 = aValues[1];
            }
        } else if (oCondition.operator === "TODAYFROMTO") {
            if (!isNaN(parseInt(oCondition.value1))) {
                oCondition.value1 = _getTodayFromToValueFrom(oCondition.value1);
            }
            if (!isNaN(parseInt(oCondition.value2))) {
                oCondition.value2 = _getTodayFromToValueTo(oCondition.value2);
            }
        }

        if (oCondition.value1 instanceof UniversalDate) {
            oCondition.value1 = oCondition.value1.oDate;
        }
        if (oCondition.value2 instanceof UniversalDate) {
            oCondition.value2 = oCondition.value2.oDate;
        }
        if (oCondition.operator === "DATE") {
            oCondition.operation = "BT";
            oCondition.value2 = oCondition.value1;
            // ensure the day and set time to beginning of day
            oCondition.value1 = DateRangeType.setStartTime(oCondition.value1).oDate;
            // include the day and set time to 23:59:59[:999] (milliseconds depending on given precision)
            oCondition.value2 = DateRangeType.setEndTime(oCondition.value2, false).oDate;
        } else if (oCondition.operator === "FROM") {
            oCondition.operation = "GE";
            delete oCondition.value2;
            oCondition.value1 = DateRangeType.setStartTime(oCondition.value1).oDate;
        } else if (oCondition.operator === "FROMDATETIME") {
            oCondition.operation = "GE";
            delete oCondition.value2;
        } else if (oCondition.operator === "TO") {
            oCondition.operation = "LE";
            delete oCondition.value2;

            // include the day and set time to 23:59:59[:999] (milliseconds depending on given precision)
            oCondition.value1 = DateRangeType.setEndTime(oCondition.value1, false).oDate;
        } else if (oCondition.operator === "SPECIFICMONTHINYEAR") {
            oCondition.operation = "BT";
            var oSPECIFICMONTHINYEARDate = new UniversalDate();
            oSPECIFICMONTHINYEARDate.setFullYear(parseInt(value2), parseInt(value1));
            aValues = UniversalDateUtils.getRange(0, "MONTH", oSPECIFICMONTHINYEARDate);
            oCondition.value1 = aValues[0].oDate;
            oCondition.value2 = aValues[1].oDate;
        } else if (oCondition.operator === "TODATETIME") {
            oCondition.operation = "LE";
            delete oCondition.value2;
        } else if (oCondition.operator === "DATETIME") {
            oCondition.operation = "EQ";

            // include [:999] (milliseconds depending on given precision)
            // oCondition.value2 = oCondition.value2 ? DateRangeType.setMilliseconds(oCondition.value2) : null;
        } else if (oCondition.operator === "DATETIMERANGE" ||
            oCondition.operator === "LASTMINUTES" ||
            oCondition.operator === "LASTHOURS" ||
            oCondition.operator === "NEXTHOURS" ||
            oCondition.operator === "NEXTMINUTES" ||
            oCondition.operator === "LASTMINUTESINCLUDED" ||
            oCondition.operator === "LASTHOURSINCLUDED" ||
            oCondition.operator === "NEXTMINUTESINCLUDED" ||
            oCondition.operator === "NEXTHOURSINCLUDED") {
            oCondition.operation = "BT";
        } else {
            // ensure the day and set time to beginning of day in the case new the option is not NEXT<X>INCLUDED
            if (oCondition.operator.indexOf("INCLUDED") === -1 && oCondition.operator.indexOf("NEXT") === -1) {
                oCondition.value1 = DateRangeType.setStartTime(oCondition.value1).oDate;
            }

            oCondition.operation = "BT";

            // include the day and set time to 23:59:59[:999] (milliseconds depending on given precision)
            oCondition.value2 = DateRangeType.setEndTime(oCondition.value2, false).oDate;

        }

        oCondition.exclude = false;
        oCondition.keyField = key;

        if (oCondition.value2) {
            if (typeof oCondition.value1.getTime === "function" &&
                typeof oCondition.value2.getTime === "function" &&
                oCondition.value1.getTime() > oCondition.value2.getTime()) {
                var oSecondDate = oCondition.value2;
                oCondition.value2 = oCondition.value1;
                oCondition.value1 = oSecondDate;
            }
        }

        return [
            new sap.ui.model.Filter({
                path: oCondition.keyField,
                operator: oCondition.operation,
                value1: oCondition.value1,
                value2: oCondition.value2,
                exclude: oCondition.exclude
            })
        ];
    };

    /**
     * 
     * @param {string} key key
     * @param {sap.m.Input} control value1
     * @returns {sap.ui.mdoel.Filter[]|undefined} filter
     */
    FilterBarUnit.Input_to_Filter = function (key, control) {
        let operator = this.getOprator(control);
        let value = control.getValue();
        let filter;
        if (value) {
            filter = new sap.ui.model.Filter(key, operator, value);
            return [filter];
        }
        return undefined;
    };

    /**
     * 
     * @param {string} key key
     * @param {sap.m.MultiInput} control control 
     * @returns {sap.ui.model.Filter[]|undefined} filter
     */
    FilterBarUnit.MultiInput_to_Filter = function (key, control) {
        let aFilters = [];
        var aTokens = control.getTokens();
        let operator = this.getOprator(control);
        aTokens.forEach(token => {
            if (!token.data("range")) {
                aFilters.push(new sap.ui.model.Filter(key, operator, token.getProperty("key")));
            } else {
                aFilters.push(new sap.ui.model.Filter({
                    path: key,
                    operator: token.data("range").operation,
                    value1: token.data("range").value1,
                    value2: token.data("range").value2 || ""
                }));
            }
        });
        if (aTokens.length > 0) {
            return aFilters;
        }
        return undefined;
    };

    /**
     * 需要在具体的输入控件种绑定operator
     * @param {sap.ui.core.Control} control control
     * @returns {string} operator
     * @example
     * <DateTimePicker 
     *      xmlns:data="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1" 
     *      data:operator="GE">
     */
    FilterBarUnit.getOprator = function (control) {
        let operator;
        if (control.data("operator")) {
            operator = control.data("operator");
        } else {
            operator = sap.ui.model.FilterOperator.EQ;
        }
        return operator;
    };

    FilterBarUnit.DateTimePicker_to_Filter = function (key, control) {
        let operator = this.getOprator(control);
        if (!control.getDateValue()) {
            return undefined;
        }
        let filter = new sap.ui.model.Filter(key, operator, control.getDateValue());
        return [filter];
    };

    FilterBarUnit.getKey = function (control) {
        let key;
        if (control.data("key")) {
            key = control.data("key");
        } else {
            key = control.getName();
        }
        return key;
    };

    FilterBarUnit.Select_to_Filter = function (key, control) {
        let operator = this.getOprator(control);
        if (!control.getSelectedKey()) {
            return undefined;
        }
        let filter = new sap.ui.model.Filter(key, operator, control.getSelectedKey());
        return [filter];
    };

    FilterBarUnit.SearchField_to_Filter = function (key, control) {
        return undefined;
    };

    FilterBarUnit.Item_to_Filter = function (item) {
        var sKey = this.getKey(item);
        var itemcontrol = item.getControl();
        var sType = itemcontrol.getMetadata().getName();
        let filters;

        switch (sType) {
            case "sap.m.Input":
                filters = this.Input_to_Filter(sKey, itemcontrol);
                break;
            case "sap.m.MultiInput":
                filters = this.MultiInput_to_Filter(sKey, itemcontrol);
                break;
            case "sap.m.DynamicDateRange":
                filters = this.DDR_to_Filter(sKey, itemcontrol);
                break;
            case "sap.m.DateTimePicker":
                filters = this.DateTimePicker_to_Filter(sKey, itemcontrol);
                break;
            case "sap.m.Select":
                filters = this.Select_to_Filter(sKey, itemcontrol);
                break;
            case "sap.m.SearchField":
                filters = this.SearchField_to_Filter(sKey, itemcontrol);
                break;
            default:
                break;
        }
        return filters;
    };

    /**
     * 自动将FilterBar中的控件转换成Filter实例
     * 他会自动选取控件的name作为key
     * 如果需要重复key的情况可以使用data:key属性
     * 输入控件中可以输入operator属性如果不输入则为EQ
     * 
     * <p><fb:FilterGroupItem</p>
     * <p>     name="logStartf"</p>
     * <p>     label="LogStart From"</p>
     * <p>     groupName="Group1"</p>
     * <p>     data:key="LogStart"</p>
     * <p>     visibleInFilterBar="true"></p>
     * <p>     <fb:control></p>
     * <p>         <DateTimePicker</p>
     * <p>             data:operator="GE"></p>
     * <p>         </DateTimePicker></p>
     * <p>     </fb:control></p>
     * <p></fb:FilterGroupItem></p>
     * @param {sap.ui.comp.filterbar.FilterBar} oFilterBar filterbar
     * @returns {sap.ui.model.Filter[]} aFilters
     * @example
     * <fb:FilterGroupItem
     *      name="logStartf"
     *      label="LogStart From"
     *      groupName="Group1"
     *      data:key="LogStart"
     *      visibleInFilterBar="true">
     *      <fb:control>
     *          <DateTimePicker
     *              data:operator="GE">
     *          </DateTimePicker>
     *      </fb:control>
     * </fb:FilterGroupItem>
     */
    FilterBarUnit.FilterBar_to_Filters = function (oFilterBar) {
        var aFilters = [];
        var aFilterItems = oFilterBar.getFilterGroupItems();

        aFilterItems.forEach(item => {
            let filters = this.Item_to_Filter(item);
            if (filters) {
                aFilters = aFilters.concat(filters);
            }
        });

        return aFilters;
    };

    /**
     * 选择性选取传入Name的filtergroupitem转换成Filter实例
     * @param {sap.ui.comp.filterbar.FilterBar} oFilterBar filterbar control
     * @param {string[]} aFilterNames filter item name list
     * @returns {sap.ui.model.Filter[]} filters
     */
    FilterBarUnit.Filters_form_Names = function (oFilterBar, aFilterNames) {
        var aFilters = [];
        var aFilterItems = oFilterBar.getFilterGroupItems();

        aFilterItems.forEach(item => {
            if (!(aFilterNames.includes(item.getName()))) { return; }
            let filters = this.Item_to_Filter(item);
            if (filters) {
                aFilters = aFilters.concat(filters);
            }
        });

        return aFilters;
    };

    return FilterBarUnit;
});