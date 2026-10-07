public class QuantEngine {
    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("{\"error\":\"No values provided\"}");
            return;
        }
        try {
            String[] raw = args[0].split(",");
            double sum = 0;
            for (String s : raw) {
                sum += Double.parseDouble(s.trim());
            }
            double avg = sum / raw.length;
            System.out.printf("{\"sma\": %.2f, \"period\": %d}%n", avg, raw.length);
        } catch (Exception e) {
            System.out.println("{\"error\":\"Invalid input format\"}");
        }
    }
}