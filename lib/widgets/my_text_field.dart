import 'package:flutter/material.dart';

class MyTextField extends StatelessWidget {
  final String label;
  final int maxLines;
  final int minLines;
  final TextEditingController controller;
  final Icon icon;
  final TextInputType tipo;
  final bool obrigatorio;
  MyTextField({this.label, this.maxLines = 1, this.minLines = 1, this.controller, this.icon, this.tipo = TextInputType.text, this.obrigatorio = false});

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      
      style: TextStyle(color: Colors.black87),
      minLines: minLines,
      maxLines: maxLines,
      controller: controller,
      keyboardType: tipo,
      validator: (value){
        if (obrigatorio && value.isEmpty) {
          return "Informe a " + label;
        } else {
          return null;
        }
      },
      decoration: InputDecoration(
        //suffixIcon: icon == null ? null: icon,
          icon: icon == null ? null: icon,
          labelText: label,
          labelStyle: TextStyle(color: Colors.black45),
          
          focusedBorder:
              UnderlineInputBorder(borderSide: BorderSide(color: Colors.black)),
          border:
              UnderlineInputBorder(borderSide: BorderSide(color: Colors.grey))),
    );
  }
}
