import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:datetime_picker_formfield/datetime_picker_formfield.dart';

class MyDateField extends StatelessWidget {
  final format = DateFormat("dd/MM/yyyy");
  final String label;
  final TextEditingController controller;
  final Icon icon;
  final bool obrigatorio;
  DateTime data;
  MyDateField(
      {this.label,
      this.controller,
      this.icon,
      this.data,
      this.obrigatorio = false});

  @override
  Widget build(BuildContext context) {
    return DateTimeField(
      format: format,
      style: TextStyle(color: Colors.black87),
      controller: controller,
      validator: (value) {
        if (obrigatorio && value != null) {
          return "Informe a " + label;
        } else {
          return null;
        }
      },
      onShowPicker: (context, currentValue) {
        return showDatePicker(
            context: context,
            firstDate: DateTime(1900),
            initialDate: currentValue ?? DateTime.now(),
            lastDate: DateTime(2100));
      },
      decoration: InputDecoration(
          //suffixIcon: icon == null ? null: icon,
          icon: icon == null ? null : icon,
          labelText: label,
          labelStyle: TextStyle(color: Colors.black45),
          focusedBorder:
              UnderlineInputBorder(borderSide: BorderSide(color: Colors.black)),
          border:
              UnderlineInputBorder(borderSide: BorderSide(color: Colors.grey))),
    );
  }
}
