import 'package:flutter/material.dart';
import 'package:persefone/theme/colors/light_colors.dart';
import 'package:persefone/theme/colors/light_colors.dart';

class TopContainer extends StatefulWidget {
  final double height;
  final double width;
  final Widget child;
  final EdgeInsets padding;
  TopContainer({this.height, this.width, this.child, this.padding});

  @override
  _TopContainerState createState() => _TopContainerState();
}

class _TopContainerState extends State<TopContainer> {



  @override
  Widget build(BuildContext context) {
    return Container(
      padding: widget.padding!=null ? widget.padding : EdgeInsets.symmetric(horizontal: 20.0),
      decoration: BoxDecoration(
          color: Colors.lightGreen,
          borderRadius: BorderRadius.only(
            bottomRight: Radius.circular(30.0),
            bottomLeft: Radius.circular(30.0),
          )),
      height: widget.height,
      width: widget.width,
      child: widget.child,
    );
  }
}
